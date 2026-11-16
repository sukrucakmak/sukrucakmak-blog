---
title: "Virtual Threads in Spring Boot with Java 25"
description: "Enabling virtual threads in Spring Boot, how Java 24+ fixed the pinning problem, the connection-pool bottleneck, scoped values, structured concurrency and observability tips."
date: 2026-11-19
tags: [java, spring, concurrency, guide]
translation: /blog/spring-boot-virtual-threads
---

## Introduction

Virtual threads, final since Java 21, made the "one thread per request" model scalable again. In Java 21, however, `synchronized` blocks pinned a virtual thread to its carrier thread, which caused unexpected bottlenecks in many libraries. JEP 491 in Java 24 largely solved that problem, and Java 25 LTS is the best target for running virtual threads in production with confidence.

This post covers enabling virtual threads in a Spring Boot application, what changes, the bottlenecks to watch out for and how to observe them.

```bash
java -version          # openjdk version "25"
```

## 1. Enabling it with one line

For Spring Boot 3.2 and later (Boot 4 included):

```properties
spring.threads.virtual.enabled=true
spring.main.keep-alive=true
```

With this setting, Spring Boot moves the following onto virtual threads:

- **Web requests:** Tomcat and Jetty handle every incoming HTTP request on a virtual thread.
- **`@Async`:** The default `applicationTaskExecutor` becomes a `SimpleAsyncTaskExecutor` that starts a new virtual thread per task.
- **`@Scheduled`:** Scheduled tasks run on virtual threads.
- **Messaging:** Listener containers such as Kafka and RabbitMQ are configured to use virtual threads.

`spring.main.keep-alive=true` matters: virtual threads are daemon threads. If your application only has `@Scheduled` tasks and no platform thread keeps the JVM alive, the JVM may exit immediately. This setting guarantees that the JVM stays up.

A simple endpoint to check:

```java
@RestController
class ThreadController {

    @GetMapping("/thread")
    String thread() {
        return Thread.currentThread().toString();
        // VirtualThread[#52]/runnable@ForkJoinPool-1-worker-3
    }
}
```

## 2. Why Java 24+ matters: JEP 491

In Java 21, if a virtual thread made a blocking I/O call inside a `synchronized` block, it could not unmount from its carrier platform thread. Since the number of carriers defaults to the number of CPU cores, a handful of pinned threads could stall the whole application. JDBC drivers, connection pools and older libraries use `synchronized`, so this was a serious problem.

With JEP 491 in Java 24, `synchronized` no longer causes pinning. Cases that still pin:

- **Native frames:** Blocking inside native code called through JNI or the Foreign Function API.
- **Class initializers:** Blocking inside a class's static initializer (`static { }`).

In practice, the refactorings to `ReentrantLock` you did for Java 21 are no longer required.

## 3. The real bottleneck: the connection pool

Virtual threads happily accept thousands of concurrent requests, but your database will not accept thousands of connections. When the HikariCP pool is exhausted, threads wait for a connection; that wait is cheap, but if `connection-timeout` is exceeded the request fails.

```properties
spring.datasource.hikari.maximum-pool-size=30
spring.datasource.hikari.connection-timeout=5000
```

Blindly growing the pool is not the answer; the database can only handle so many connections. The same applies to outbound calls: you don't want to send 5,000 concurrent requests to a rate-limited API. Use a `Semaphore` to limit concurrency:

```java
@Service
class PaymentGateway {

    private final Semaphore permits = new Semaphore(50);
    private final RestClient restClient;

    PaymentGateway(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("https://payments.example.com").build();
    }

    PaymentResponse charge(PaymentRequest request) throws InterruptedException {
        permits.acquire();
        try {
            return restClient.post()
                    .uri("/charges")
                    .body(request)
                    .retrieve()
                    .body(PaymentResponse.class);
        } finally {
            permits.release();
        }
    }
}
```

In the platform-thread world, the pool size limited concurrency; with virtual threads you have to set that limit **explicitly**.

## 4. Blocking code is normal again

With virtual threads, blocking APIs such as `RestClient`, `JdbcClient` and `JdbcTemplate` scale again. You can write simple, readable code without moving to reactive programming:

```java
@Service
class OrderService {

    private final JdbcClient jdbc;
    private final RestClient inventory;

    OrderService(JdbcClient jdbc, RestClient.Builder builder) {
        this.jdbc = jdbc;
        this.inventory = builder.baseUrl("http://inventory").build();
    }

    OrderView find(long id) {
        var order = jdbc.sql("select id, product_id, quantity from orders where id = :id")
                .param("id", id)
                .query(Order.class)
                .single();
        var stock = inventory.get()
                .uri("/stock/{productId}", order.productId())
                .retrieve()
                .body(Stock.class);
        return new OrderView(order, stock);
    }
}
```

**Don't pool virtual threads.** Passing a virtual thread factory to `Executors.newFixedThreadPool(...)` defeats the whole purpose. Create a new one per task: `Executors.newVirtualThreadPerTaskExecutor()`.

## 5. Scoped values instead of ThreadLocal

Each of millions of virtual threads may carry its own `ThreadLocal` copy; using `ThreadLocal` to cache large objects (formatters, buffers) can turn into a memory problem. **Scoped values** (JEP 506), final in Java 25, offer an immutable alternative bound to a well-defined scope:

```java
public final class RequestContext {
    public static final ScopedValue<String> TENANT = ScopedValue.newInstance();
}

// In a filter
ScopedValue.where(RequestContext.TENANT, tenantId)
        .run(() -> chain.doFilter(request, response));

// Deep inside a service
String tenant = RequestContext.TENANT.get();
```

The value disappears automatically when the scope ends; there is no risk of forgetting to call `remove()`. Libraries (Spring Security, MDC and so on) still use `ThreadLocal`, so a full migration isn't possible yet, but prefer scoped values in your own code.

## 6. Parallel calls with structured concurrency

To call several services in parallel within one request, structured concurrency (still a **preview** in Java 25, requires `--enable-preview`) is a great fit:

```java
ProductPage load(long productId) throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        var product = scope.fork(() -> catalog.product(productId));
        var reviews = scope.fork(() -> reviewService.reviews(productId));
        var price   = scope.fork(() -> pricing.price(productId));

        scope.join();   // if one fails, the others are cancelled

        return new ProductPage(product.get(), reviews.get(), price.get());
    }
}
```

Each `fork` starts a new virtual thread. If one subtask fails, the others are cancelled and the failure is thrown from `join()`. There are no thread leaks; no subtask outlives the scope. The preview API has changed between releases, so check the release notes before using it in production.

## 7. Observability and diagnostics

The `-Djdk.tracePinnedThreads` option from Java 21 has been removed. Track pinning with JFR instead:

```bash
java -XX:StartFlightRecording=duration=60s,filename=app.jfr -jar app.jar
jfr print --events jdk.VirtualThreadPinned app.jfr
```

To dump all threads (virtual ones included) of a running application:

```bash
jcmd <pid> Thread.dump_to_file -format=json threads.json
```

Classic `jstack` output doesn't show virtual threads; the JSON dump lists them along with the executor they belong to.

## 8. A simple load test

Consider an endpoint that waits 200 ms on I/O:

```java
@GetMapping("/slow")
String slow() throws InterruptedException {
    Thread.sleep(200);   // simulates a database / HTTP call
    return "ok";
}
```

1,000 concurrent connections with `oha` or `hey`:

```bash
oha -z 30s -c 1000 http://localhost:8080/slow
hey -z 30s -c 1000 http://localhost:8080/slow
```

With Tomcat's default pool of 200 threads, throughput caps out around 1,000 requests per second (200 threads / 0.2 s); with virtual threads that ceiling disappears and throughput grows with the number of concurrent connections. These numbers are purely illustrative; real results depend on your workload and on your database and downstream limits. Measure with your own scenario.

## 9. Platform thread or virtual thread?

| | Platform thread | Virtual thread |
| --- | --- | --- |
| Managed by | Operating system | JVM |
| Memory | ~1 MB stack | A few KB, grows as needed |
| Count | Thousands | Millions |
| Creation cost | High, pooled | Low, not pooled |
| Best for | CPU-bound work | I/O-bound work |
| Concurrency limit | Pool size | `Semaphore`, connection pool |

## 10. When not to use them

- **CPU-bound work:** Image processing, encryption and heavy computation don't get faster with virtual threads; a bounded platform-thread pool is a better fit.
- **Already reactive applications:** Moving a well-functioning WebFlux application to virtual threads brings little gain. For new projects, virtual threads + Spring MVC is usually the simpler choice.
- **Native-heavy work:** Blocking in JNI calls still pins.

## Conclusion

With Java 25, virtual threads are largely free of the pinning limitations of Java 21. In Spring Boot they are enabled with a single property and let you run blocking, readable code with high concurrency. The thing to watch is no longer the number of threads but limited resources such as database connections and downstream services. Protect them with a `Semaphore` and proper pool settings, prefer scoped values over `ThreadLocal`, and don't forget to measure with JFR.
