---
title: "Spring Boot 4 ve Spring Framework 7: Yenilikler ve Geçiş Rehberi"
description: "Spring Boot 4 ve Spring Framework 7 ile gelen başlıca değişiklikler — Jakarta EE 11, modüler auto-configuration, JSpecify null-safety, API versioning, HTTP service client'lar, dahili resilience, Jackson 3 ve 3.5'ten geçiş adımları."
date: 2026-11-18
tags: [java, spring, rehber]
translation: /en/blog/spring-boot-4-whats-new
---

## Giriş

Spring Boot 4, Spring Framework 7 üzerine kurulu yeni ana sürümdür. Spring Boot 3'teki `javax` → `jakarta` geçişi kadar sarsıcı değil; ancak bağımlılık yapısı, varsayılan JSON kütüphanesi ve bazı API'ler değiştiği için bilinçli bir geçiş planı gerektiriyor. Bu yazıda öne çıkan yenilikleri ve 3.5'ten 4'e geçerken izlenecek adımları ele alıyoruz.

## 1. Temel gereksinimler

| Bileşen | Spring Boot 4 / Framework 7 |
| --- | --- |
| Java | Minimum 17, önerilen 25 (LTS) |
| Jakarta EE | 11 — Servlet 6.1, Persistence (JPA) 3.2, Bean Validation 3.1 |
| Hibernate ORM | 7.x |
| Kotlin | 2.2 |
| Gömülü sunucu | Tomcat veya Jetty; Undertow desteği kaldırıldı |

Java 17 hâlâ yeterli olsa da virtual thread'lerdeki iyileştirmeler, AOT cache ve compact object headers gibi kazanımlar için Java 25 ile çalıştırmak mantıklı.

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

## 2. Modüler auto-configuration ve yeni starter'lar

Spring Boot 3'te tüm auto-configuration sınıfları tek bir büyük `spring-boot-autoconfigure` jar'ında bulunuyordu. Boot 4'te bu yapı teknolojiye özel, daha küçük modüllere bölündü. Sonuç: classpath'te sadece kullandığınız teknolojinin kodu bulunur, uygulama daha hızlı açılır ve IDE önerileri daha anlamlı hale gelir.

Starter'lar da buna paralel olarak daha net isimlendirildi. Örneğin Spring MVC tabanlı web uygulamaları için `spring-boot-starter-webmvc` kullanılır:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webmvc</artifactId>
</dependency>
```

Geçişi kolaylaştırmak için eski davranışa yakın, geniş kapsamlı "classic" starter'lar da sunuluyor. Büyük bir projeyi taşırken önce bunlarla derlemeyi sağlayıp ardından teknolojiye özel starter'lara geçmek iyi bir strateji. Bazı test anotasyonlarının paketleri de modüllerle birlikte taşındı; derleme hatalarında IDE'nin import önerilerine bakmak genellikle yeterli.

## 3. JSpecify ile null-safety

Spring Framework 7, kendi `org.springframework.lang.Nullable` anotasyonları yerine standart **JSpecify** anotasyonlarına geçti. Spring API'lerinin null davranışı artık IntelliJ, NullAway ve Kotlin tarafından doğru anlaşılıyor. Kendi kodunuzda da aynı yaklaşımı kullanabilirsiniz:

```java
// package-info.java
@NullMarked
package com.example.orders;

import org.jspecify.annotations.NullMarked;
```

```java
import org.jspecify.annotations.Nullable;

public interface CustomerRepository {
    @Nullable Customer findByEmail(String email);   // null dönebilir
    Customer getById(long id);                       // asla null dönmez
}
```

`@NullMarked` paketindeki her tip varsayılan olarak non-null kabul edilir; yalnızca null olabilecek yerleri `@Nullable` ile işaretlersiniz.

## 4. API versioning

REST API'lerde versiyonlama artık framework seviyesinde destekleniyor. Aynı path için farklı versiyonlara farklı handler yazabilirsiniz:

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

Versiyonun istekten nasıl okunacağı Spring Boot property'si ile belirlenir:

```properties
spring.mvc.apiversion.use.header=API-Version
```

```bash
curl -H "API-Version: 1.1" http://localhost:8080/api/users/42
```

Header dışında query parametresi, path segment'i veya media type parametresi ile versiyonlama da desteklenir.

## 5. HTTP service client'lar

`@HttpExchange` arayüzleri Spring 6'dan beri vardı, ancak her biri için `HttpServiceProxyFactory` ile manuel bean tanımı gerekiyordu. Artık gruplar halinde otomatik kaydediliyor:

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

Artık `GithubClient`'ı herhangi bir bean'e enjekte edip doğrudan kullanabilirsiniz; altında `RestClient` çalışır.

## 6. Dahili resilience: retry ve eşzamanlılık limiti

Spring Retry projesindeki temel özellikler Spring Framework çekirdeğine taşındı. Ek bağımlılık olmadan metot seviyesinde yeniden deneme ve eşzamanlılık sınırı tanımlanabilir:

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

`@ConcurrencyLimit` özellikle virtual thread'lerle çalışırken önemli: thread sayısı artık doğal bir sınır olmadığı için, yavaş bir dış servise aynı anda kaç istek gideceğini açıkça sınırlamak gerekir.

## 7. Jackson 3

Spring Boot 4'ün varsayılan JSON kütüphanesi Jackson 3'tür. En göze çarpan değişiklik paket ve group id'ler:

| | Jackson 2 | Jackson 3 |
| --- | --- | --- |
| Group id | `com.fasterxml.jackson.core` | `tools.jackson.core` |
| Paket | `com.fasterxml.jackson.databind` | `tools.jackson.databind` |
| Önerilen tip | `ObjectMapper` | `JsonMapper` (immutable, builder ile yapılandırılır) |
| Anotasyonlar | `com.fasterxml.jackson.annotation` | Aynı kalır |

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

`@JsonProperty`, `@JsonIgnore` gibi anotasyonlar aynı pakette kaldığı için DTO'larınızın çoğu değişmeden çalışır. Değişiklik ağırlıkla `ObjectMapper` özelleştirmelerinde ve kendi serializer/deserializer'larınızda olur. Jackson 3 ayrıca checked `JsonProcessingException` yerine unchecked exception'lar kullanır.

## 8. Diğer yenilikler

- **RestTestClient:** `MockMvc` veya çalışan bir sunucu üzerinde, `WebTestClient` benzeri akıcı bir API ile REST testleri yazmak için.
- **BeanRegistrar:** Bean'leri programatik olarak, koşullu ve döngü içinde kaydetmek için yeni arayüz; `@Import` ile kullanılır ve AOT/native image ile uyumludur.
- **Hibernate 7:** Jakarta Persistence 3.2 desteği; bazı deprecated API'ler kaldırıldı.

## 9. Geçiş kontrol listesi

1. Önce Spring Boot **3.5.x**'in en son sürümüne geçin ve tüm deprecation uyarılarını giderin; 4.0'da kaldırılan API'lerin çoğu 3.x'te deprecated olarak işaretlenmişti.
2. Geçiş süresince `spring-boot-properties-migrator` ekleyin; yeniden adlandırılan property'leri açılışta loglar:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-properties-migrator</artifactId>
    <scope>runtime</scope>
</dependency>
```

3. `javax.*` import'larının tamamen `jakarta.*`'ya geçtiğinden emin olun (Boot 3 ile yapılmış olmalı).
4. Starter'ları güncelleyin; gerekirse önce classic starter'larla derleyin.
5. Undertow kullanıyorsanız Tomcat veya Jetty'ye geçin.
6. Hibernate 7 geçiş notlarını inceleyin; özel `UserType`'lar, dialect ayarları ve native sorgular test edilmeli.
7. Jackson 3: `ObjectMapper` özelleştirmeleri, custom serializer'lar ve `com.fasterxml.jackson.databind` import'ları güncellenmeli.
8. Spring Cloud, Spring Security, Spring AI gibi diğer Spring projelerinin Boot 4 uyumlu sürümlerine yükseltin.
9. Tüm test paketini çalıştırın ve migrator loglarını kontrol ettikten sonra `spring-boot-properties-migrator`'ı kaldırın.

## Sonuç

Spring Boot 4, Boot 3'teki gibi büyük bir kırılma değil; daha çok yılların biriktirdiği yükü temizleyen ve modern Java'ya odaklanan bir sürüm. Modüler yapı daha hafif uygulamalar, JSpecify daha güvenli kod, API versioning, HTTP service client'lar ve dahili resilience ise daha az üçüncü parti bağımlılık anlamına geliyor. Geçişi 3.5 üzerinden, deprecation'ları temizleyerek ve Jackson 3 ile Hibernate 7 değişikliklerini test ederek yaparsanız süreç oldukça sorunsuz geçer.
