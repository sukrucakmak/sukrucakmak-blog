---
title: "Spring Boot 4 and Spring Framework 7: What's New and How to Migrate"
description: "The main changes in Spring Boot 4 and Spring Framework 7 — Jakarta EE 11, modular auto-configuration, JSpecify null-safety, API versioning, HTTP service clients, built-in resilience, Jackson 3 and the steps to migrate from 3.5."
date: 2026-11-18
tags: [java, spring, guide]
translation: /blog/spring-boot-4-whats-new
---

## Introduction

Spring Boot 4 is the new major release, built on Spring Framework 7. It is not as disruptive as the `javax` → `jakarta` move in Spring Boot 3, but the dependency layout, the default JSON library and some APIs have changed, so it deserves a deliberate migration plan. This post covers the highlights and the steps to follow when moving from 3.5 to 4.

## 1. Baselines

| Component | Spring Boot 4 / Framework 7 |
| --- | --- |
| Java | Minimum 17, recommended 25 (LTS) |
| Jakarta EE | 11 — Servlet 6.1, Persistence (JPA) 3.2, Bean Validation 3.1 |
| Hibernate ORM | 7.x |
| Kotlin | 2.2 |
| Embedded server | Tomcat or Jetty; Undertow support was dropped |

Java 17 is still enough, but running on Java 25 makes sense for the virtual thread improvements, the AOT cache and compact object headers.

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.0</version>
</parent>

<properties>
    <java.version>25</java.version>
</properties>
```

## 2. Modular auto-configuration and new starters

In Spring Boot 3 all auto-configuration classes lived in a single large `spring-boot-autoconfigure` jar. In Boot 4 that was split into smaller, technology-specific modules. The result: only the code for the technologies you use is on the classpath, the application starts faster and IDE suggestions become more relevant.

Starters were renamed in the same spirit to be more explicit. For example, Spring MVC based web applications use `spring-boot-starter-webmvc`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webmvc</artifactId>
</dependency>
```

To ease migration there are also broad "classic" starters that behave close to the old layout. When moving a large project, getting it to compile with those first and then switching to technology-specific starters is a good strategy. Some test annotations moved packages along with the modules; for compile errors, the IDE's import suggestions are usually enough.

## 3. Null-safety with JSpecify

Spring Framework 7 replaced its own `org.springframework.lang.Nullable` annotations with the standard **JSpecify** annotations. The nullness of Spring APIs is now understood correctly by IntelliJ, NullAway and Kotlin. You can use the same approach in your own code:

```java
// package-info.java
@NullMarked
package com.example.orders;

import org.jspecify.annotations.NullMarked;
```

```java
import org.jspecify.annotations.Nullable;

public interface CustomerRepository {
    @Nullable Customer findByEmail(String email);   // may return null
    Customer getById(long id);                       // never returns null
}
```

Every type in a `@NullMarked` package is non-null by default; you only mark the places that can be null with `@Nullable`.

## 4. API versioning

Versioning REST APIs is now supported at the framework level. You can write different handlers for different versions of the same path:

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping(path = "/{id}", version = "1.0")
    public UserV1 getV1(@PathVariable long id) {
        return userService.findV1(id);
    }

    @GetMapping(path = "/{id}", version = "1.1")
    public UserV2 getV2(@PathVariable long id) {
        return userService.findV2(id);
    }
}
```

How the version is read from the request is configured with a Spring Boot property:

```properties
spring.mvc.apiversion.use.header=API-Version
```

```bash
curl -H "API-Version: 1.1" http://localhost:8080/api/users/42
```

Besides a header, versioning via a query parameter, a path segment or a media type parameter is also supported.

## 5. HTTP service clients

`@HttpExchange` interfaces have existed since Spring 6, but each needed a manual bean definition through `HttpServiceProxyFactory`. Now they are registered automatically in groups:

```java
@HttpExchange("/repos")
public interface GithubClient {

    @GetExchange("/{owner}/{repo}")
    Repository getRepository(@PathVariable String owner, @PathVariable String repo);
}
```

```java
@Configuration
@ImportHttpServices(group = "github", types = GithubClient.class)
public class HttpClientsConfig { }
```

```properties
spring.http.serviceclient.github.base-url=https://api.github.com
```

You can now inject `GithubClient` into any bean and use it directly; `RestClient` runs underneath.

## 6. Built-in resilience: retry and concurrency limits

The core features of the Spring Retry project moved into Spring Framework itself. Method-level retries and concurrency limits work without an extra dependency:

```java
@Configuration
@EnableResilientMethods
public class ResilienceConfig { }
```

```java
@Service
public class PaymentGateway {

    @Retryable(includes = ConnectException.class)
    public PaymentResult charge(PaymentRequest request) {
        return client.charge(request);
    }

    @ConcurrencyLimit(10)
    public Report generateReport(long id) {
        return reportEngine.render(id);
    }
}
```

`@ConcurrencyLimit` matters especially with virtual threads: since the thread count is no longer a natural limit, you have to explicitly cap how many requests hit a slow downstream service at the same time.

## 7. Jackson 3

Jackson 3 is the default JSON library in Spring Boot 4. The most visible change is the packages and group ids:

| | Jackson 2 | Jackson 3 |
| --- | --- | --- |
| Group id | `com.fasterxml.jackson.core` | `tools.jackson.core` |
| Package | `com.fasterxml.jackson.databind` | `tools.jackson.databind` |
| Preferred type | `ObjectMapper` | `JsonMapper` (immutable, configured via builder) |
| Annotations | `com.fasterxml.jackson.annotation` | Unchanged |

```java
import tools.jackson.databind.json.JsonMapper;

@Service
public class EventPublisher {
    private final JsonMapper jsonMapper;

    public EventPublisher(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    public String toJson(OrderCreated event) {
        return jsonMapper.writeValueAsString(event);
    }
}
```

Since annotations such as `@JsonProperty` and `@JsonIgnore` stay in the same package, most of your DTOs keep working unchanged. The changes are mostly in `ObjectMapper` customizations and your own serializers/deserializers. Jackson 3 also uses unchecked exceptions instead of the checked `JsonProcessingException`.

## 8. Other additions

- **RestTestClient:** write REST tests against `MockMvc` or a running server with a fluent, `WebTestClient`-like API.
- **BeanRegistrar:** a new interface for registering beans programmatically, conditionally or in loops; used via `@Import` and compatible with AOT/native images.
- **Hibernate 7:** Jakarta Persistence 3.2 support; some deprecated APIs were removed.

## 9. Migration checklist

1. First move to the latest Spring Boot **3.5.x** and fix all deprecation warnings; most APIs removed in 4.0 were marked deprecated in 3.x.
2. Add `spring-boot-properties-migrator` during the migration; it logs renamed properties at startup:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-properties-migrator</artifactId>
    <scope>runtime</scope>
</dependency>
```

3. Make sure all `javax.*` imports are fully moved to `jakarta.*` (this should already be done with Boot 3).
4. Update your starters; compile with the classic starters first if needed.
5. If you use Undertow, switch to Tomcat or Jetty.
6. Read the Hibernate 7 migration notes; custom `UserType`s, dialect settings and native queries need testing.
7. Jackson 3: update `ObjectMapper` customizations, custom serializers and `com.fasterxml.jackson.databind` imports.
8. Upgrade other Spring projects such as Spring Cloud, Spring Security and Spring AI to their Boot 4 compatible versions.
9. Run the full test suite, check the migrator logs, then remove `spring-boot-properties-migrator`.

## Conclusion

Spring Boot 4 is not a big break like Boot 3 was; it is more of a release that clears out years of accumulated baggage and focuses on modern Java. The modular layout means lighter applications, JSpecify means safer code, and API versioning, HTTP service clients and built-in resilience mean fewer third-party dependencies. If you migrate through 3.5, clean up deprecations and test the Jackson 3 and Hibernate 7 changes, the process goes quite smoothly.
