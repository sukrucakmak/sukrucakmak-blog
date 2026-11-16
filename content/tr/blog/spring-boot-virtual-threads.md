---
title: "Java 25 ile Spring Boot'ta Virtual Threads"
description: "Spring Boot uygulamalarında virtual thread'leri açmak, Java 24+ ile pinning sorununun çözülmesi, connection pool darboğazı, scoped values, structured concurrency ve izleme ipuçları."
date: 2026-11-19
tags: [java, spring, concurrency, rehber]
translation: /en/blog/spring-boot-virtual-threads
---

## Giriş

Java 21 ile kalıcı hale gelen virtual thread'ler, "her isteğe bir thread" modelini tekrar ölçeklenebilir kıldı. Ancak Java 21'de `synchronized` blokların virtual thread'i taşıyıcı thread'e sabitlemesi (pinning), birçok kütüphanede beklenmedik darboğazlara yol açıyordu. Java 24 ile gelen JEP 491 bu sorunu büyük ölçüde çözdü; Java 25 LTS ise virtual thread'leri production'da gönül rahatlığıyla kullanmak için en iyi hedef sürüm.

Bu yazıda Spring Boot uygulamasında virtual thread'leri açmayı, neyin değiştiğini, dikkat edilmesi gereken darboğazları ve izleme yöntemlerini ele alıyoruz.

```bash
java -version          # openjdk version "25"
```

## 1. Tek satırla açmak

Spring Boot 3.2 ve sonrası (Boot 4 dahil) için:

```properties
spring.threads.virtual.enabled=true
spring.main.keep-alive=true
```

Bu ayar açıldığında Spring Boot şunları virtual thread'lere taşır:

- **Web istekleri:** Tomcat ve Jetty, gelen her HTTP isteğini bir virtual thread üzerinde işler.
- **`@Async`:** Varsayılan `applicationTaskExecutor` bir `SimpleAsyncTaskExecutor` olur ve her görev için yeni bir virtual thread açar.
- **`@Scheduled`:** Zamanlanmış görevler virtual thread'lerde çalışır.
- **Mesajlaşma:** Kafka, RabbitMQ gibi listener container'ları virtual thread kullanacak şekilde yapılandırılır.

`spring.main.keep-alive=true` önemlidir: virtual thread'ler daemon thread'dir. Uygulamanızda sadece `@Scheduled` görevler varsa ve hiçbir platform thread JVM'i ayakta tutmuyorsa, JVM hemen kapanabilir. Bu ayar JVM'in açık kalmasını garanti eder.

Kontrol etmek için basit bir endpoint:

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

## 2. Neden Java 24+ önemli: JEP 491

Java 21'de bir virtual thread `synchronized` blok içindeyken bloklayan bir I/O çağrısı yaparsa, taşıyıcı (carrier) platform thread'den ayrılamıyordu. Taşıyıcı sayısı varsayılan olarak CPU çekirdek sayısı kadar olduğundan, birkaç sabitlenmiş thread tüm uygulamayı kilitleyebiliyordu. JDBC sürücüleri, bağlantı havuzları ve eski kütüphaneler `synchronized` kullandığı için bu ciddi bir sorundu.

Java 24'teki JEP 491 ile `synchronized` artık pinning'e yol açmıyor. Hâlâ sabitlenmeye neden olan durumlar:

- **Native frame'ler:** JNI veya Foreign Function API ile çağrılan native kod içinde bloklanma.
- **Class initializer'lar:** Bir sınıfın statik başlatıcısı (`static { }`) içinde bloklanma.

Pratikte bu, Java 21'de `ReentrantLock`'a geçmek için yaptığınız refactoring'lerin artık zorunlu olmadığı anlamına gelir.

## 3. Asıl darboğaz: connection pool

Virtual thread'ler binlerce isteği eşzamanlı kabul eder, ama veritabanınız binlerce bağlantıyı kabul etmez. HikariCP havuzu dolduğunda thread'ler bağlantı için bekler; bu bekleme ucuzdur ama `connection-timeout` aşılırsa istek hata alır.

```properties
spring.datasource.hikari.maximum-pool-size=30
spring.datasource.hikari.connection-timeout=5000
```

Havuzu körü körüne büyütmek çözüm değildir; veritabanının kaldırabileceği bağlantı sayısı sınırlıdır. Aynı mantık dış servis çağrıları için de geçerli: rate limit'i olan bir API'ye 5.000 eşzamanlı istek göndermek istemezsiniz. Eşzamanlılığı sınırlamak için `Semaphore` kullanın:

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

Platform thread dünyasında eşzamanlılığı thread havuzunun boyutu sınırlıyordu; virtual thread'lerle bu sınırı **açıkça** koymanız gerekir.

## 4. Bloklayan kod tekrar normal

Virtual thread'lerle `RestClient`, `JdbcClient` ve `JdbcTemplate` gibi bloklayan API'ler yeniden ölçeklenebilir hale gelir. Reaktif koda geçmeden basit, okunabilir kod yazabilirsiniz:

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

**Virtual thread'leri havuzlamayın.** `Executors.newFixedThreadPool(...)` içine virtual thread factory vermek, virtual thread'lerin bütün amacını boşa çıkarır. Her görev için yeni bir tane açın: `Executors.newVirtualThreadPerTaskExecutor()`.

## 5. ThreadLocal yerine scoped values

Milyonlarca virtual thread'in her biri kendi `ThreadLocal` kopyasını taşıyabilir; büyük nesneler (formatter'lar, buffer'lar) cache'lemek için `ThreadLocal` kullanmak bellek sorununa dönüşebilir. Java 25'te kalıcı hale gelen **scoped values** (JEP 506), değiştirilemez ve belirli bir kapsamla sınırlı bir alternatif sunar:

```java
public final class RequestContext {
    public static final ScopedValue<String> TENANT = ScopedValue.newInstance();
}

// Filter içinde
ScopedValue.where(RequestContext.TENANT, tenantId)
        .run(() -> chain.doFilter(request, response));

// Derindeki bir serviste
String tenant = RequestContext.TENANT.get();
```

Değer kapsam bitince otomatik olarak kaybolur; `remove()` çağırmayı unutma riski yoktur. Kütüphaneler (Spring Security, MDC vb.) hâlâ `ThreadLocal` kullandığı için tamamen geçiş henüz mümkün değil, ancak kendi kodunuzda scoped values tercih edin.

## 6. Structured concurrency ile paralel çağrılar

Bir istekte birden fazla servisi paralel çağırmak için structured concurrency (Java 25'te hâlâ **önizleme**, `--enable-preview` gerekir) çok uygun:

```java
ProductPage load(long productId) throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        var product = scope.fork(() -> catalog.product(productId));
        var reviews = scope.fork(() -> reviewService.reviews(productId));
        var price   = scope.fork(() -> pricing.price(productId));

        scope.join();   // biri hata verirse diğerleri iptal edilir

        return new ProductPage(product.get(), reviews.get(), price.get());
    }
}
```

Her `fork` yeni bir virtual thread açar. Görevlerden biri başarısız olursa diğerleri iptal edilir ve hata `join()` üzerinden fırlatılır. Thread sızıntısı olmaz; scope kapanmadan hiçbir alt görev ortada kalmaz. Önizleme API'si sürümler arasında değiştiği için production'da kullanmadan önce sürüm notlarını kontrol edin.

## 7. İzleme ve teşhis

Java 21'deki `-Djdk.tracePinnedThreads` seçeneği kaldırıldı. Pinning'i artık JFR ile izleyin:

```bash
java -XX:StartFlightRecording=duration=60s,filename=app.jfr -jar app.jar
jfr print --events jdk.VirtualThreadPinned app.jfr
```

Çalışan bir uygulamanın tüm thread'lerini (virtual dahil) dökmek için:

```bash
jcmd <pid> Thread.dump_to_file -format=json threads.json
```

Klasik `jstack` çıktısı virtual thread'leri göstermez; JSON formatlı dump ise virtual thread'leri ve hangi executor'a ait olduklarını listeler.

## 8. Basit bir yük testi

Aşağıdaki gibi 200 ms'lik bir I/O bekleyen endpoint'i düşünün:

```java
@GetMapping("/slow")
String slow() throws InterruptedException {
    Thread.sleep(200);   // veritabanı / HTTP çağrısı simülasyonu
    return "ok";
}
```

`oha` veya `hey` ile 1.000 eşzamanlı bağlantı:

```bash
oha -z 30s -c 1000 http://localhost:8080/slow
hey -z 30s -c 1000 http://localhost:8080/slow
```

Tomcat'in varsayılan 200 thread'lik havuzuyla saniyede yaklaşık 1.000 istek (200 thread / 0,2 s) civarında tavan yapılırken, virtual thread'lerle bu sınır ortadan kalkar ve throughput eşzamanlı bağlantı sayısıyla birlikte artar. Bu rakamlar tamamen örnektir; gerçek sonuçlar iş yükünüze, veritabanı ve dış servis limitlerinize bağlıdır. Kendi senaryonuzla ölçün.

## 9. Platform thread mi, virtual thread mi?

| | Platform thread | Virtual thread |
| --- | --- | --- |
| Yönetim | İşletim sistemi | JVM |
| Bellek | ~1 MB stack | Birkaç KB, ihtiyaç kadar büyür |
| Sayı | Binler | Milyonlar |
| Oluşturma maliyeti | Yüksek, havuzlanır | Düşük, havuzlanmaz |
| En uygun iş | CPU ağırlıklı | I/O ağırlıklı |
| Eşzamanlılık sınırı | Havuz boyutu | `Semaphore`, connection pool |

## 10. Ne zaman kullanmamalı?

- **CPU ağırlıklı işler:** Görüntü işleme, şifreleme, büyük hesaplamalar virtual thread'lerle hızlanmaz; sınırlı bir platform thread havuzu daha uygundur.
- **Zaten reaktif olan uygulamalar:** WebFlux ile yazılmış, iyi çalışan bir uygulamayı virtual thread'lere taşımanın kazancı azdır. Yeni projelerde ise virtual thread + Spring MVC genellikle daha basit bir tercih.
- **Native kod yoğun işler:** JNI çağrılarında bloklanma hâlâ pinning'e yol açar.

## Sonuç

Java 25 ile virtual thread'ler, Java 21'deki pinning kısıtlarından büyük ölçüde kurtuldu. Spring Boot'ta tek bir property ile açılabiliyor ve bloklayan, okunabilir kodu yüksek eşzamanlılıkla çalıştırmayı mümkün kılıyor. Asıl dikkat edilmesi gereken nokta artık thread sayısı değil; veritabanı bağlantıları ve dış servisler gibi sınırlı kaynaklar. Bu kaynakları `Semaphore` ve doğru havuz ayarlarıyla koruyun, `ThreadLocal` yerine scoped values tercih edin ve JFR ile ölçmeyi unutmayın.
