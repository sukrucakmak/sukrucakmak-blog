---
title: "Testcontainers ile Spring Boot ve JPA Testleri"
description: "H2 yerine gerçek PostgreSQL ile test: @ServiceConnection, @DataJpaTest, Flyway migration'ları, sorgu sayısıyla N+1 regresyon testi, container reuse ve uygulamayı lokalde container'larla çalıştırma."
date: 2026-11-26
tags: [java, spring, hibernate, docker, rehber]
translation: /en/blog/spring-boot-testcontainers
---

## Giriş

JPA/Hibernate kodunu test ederken uzun yıllar varsayılan tercih H2 gibi in-memory bir veritabanıydı: hızlı, kurulum gerektirmiyor. Ama testler H2'de geçip production'daki PostgreSQL'de patlayan sorgular, bu kolaylığın bedelidir.

**Testcontainers**, testler sırasında Docker üzerinde gerçek bir veritabanı (ya da Redis, Kafka, RabbitMQ...) başlatır ve test bitince kaldırır. Spring Boot'un `@ServiceConnection` desteğiyle birlikte kurulum birkaç satıra iner. Bu yazı, Hibernate ve Spring Boot serisindeki örnekleri gerçek bir veritabanına karşı nasıl test edeceğimizi gösteriyor.

## 1. Neden H2 değil?

| Konu | H2 | PostgreSQL |
| --- | --- | --- |
| SQL dialect | Uyumluluk modu var ama birebir değil | Production ile aynı |
| `jsonb`, array, `uuid` tipleri | Kısıtlı ya da farklı davranış | Tam destek |
| Native sorgular, window function'lar | Kısmen | Tam |
| `FOR UPDATE SKIP LOCKED`, lock davranışı | Farklı | Production ile aynı |
| Migration'lar (Flyway) | Ayrı script gerekebilir | Aynı script'ler |
| Index ve constraint hataları | Farklı mesaj/davranış | Aynı |

Kısacası H2 testleri, gerçekte kullanmadığınız bir veritabanını test eder. Testcontainers ile testleriniz production'daki sürümle aynı PostgreSQL üzerinde çalışır.

## 2. Bağımlılıklar

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-testcontainers</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>testcontainers-postgresql</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>testcontainers-junit-jupiter</artifactId>
  <scope>test</scope>
</dependency>
```

Sürümleri Spring Boot'un dependency management'ı yönetir; elle sürüm yazmayın. Not: **Testcontainers 2.x** ile modül artifact'leri `testcontainers-<modül>` şeklinde yeniden adlandırıldı ve bazı sınıfların paketleri değişti (örneğin `PostgreSQLContainer` artık `org.testcontainers.postgresql` paketinde). Testcontainers 1.x kullanan eski projelerde artifact adı `postgresql`'dir.

Makinede Docker (ya da Podman gibi uyumlu bir runtime) çalışıyor olmalıdır.

## 3. Container'ı bean olarak tanımlama

Spring Boot 3.1'den beri en temiz yöntem, container'ı bir test konfigürasyonunda bean olarak tanımlamak ve `@ServiceConnection` ile işaretlemektir:

```java
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgres() {
        return new PostgreSQLContainer("postgres:17-alpine");
    }
}
```

`@ServiceConnection` sayesinde `spring.datasource.url`, kullanıcı adı ve şifre container'dan otomatik alınır; hiçbir property yazmanıza gerek kalmaz. Container, Spring context'iyle birlikte başlar ve context kapanınca durur.

Image etiketini production'daki PostgreSQL sürümüyle aynı tutun.

## 4. @SpringBootTest ile entegrasyon testi

```java
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class OrderServiceIT {

    @Autowired
    OrderService orderService;

    @Autowired
    OrderRepository orderRepository;

    @Test
    void createsOrderWithItems() {
        Long id = orderService.create(new CreateOrder("sukru", List.of("kitap", "kalem")));

        Order order = orderRepository.findWithItemsById(id).orElseThrow();
        assertThat(order.getItems()).hasSize(2);
    }
}
```

> Spring Boot 4 ile test slice anotasyonları (`@DataJpaTest`, `@WebMvcTest`...) teknoloji bazlı modüllere taşındı ve paketleri değişti. Import satırlarını ezberlemek yerine IDE'nin çözmesine izin verin; ilgili `spring-boot-starter-*-test` bağımlılığının ekli olduğundan emin olun.

## 5. @DataJpaTest ile repository testi

`@DataJpaTest` yalnızca JPA katmanını yükler ve varsayılan olarak DataSource'u gömülü bir veritabanıyla değiştirmeye çalışır. Gerçek container'ı kullanmak için bunu kapatıyoruz:

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
class PostRepositoryTest {

    @Autowired
    PostRepository postRepository;

    @Autowired
    TestEntityManager em;

    @Test
    void findsPublishedPostsByTag() {
        em.persist(new Post("Java 25", "java", true));
        em.persist(new Post("Taslak", "java", false));
        em.flush();

        assertThat(postRepository.findPublishedByTag("java"))
                .extracting(Post::getTitle)
                .containsExactly("Java 25");
    }
}
```

`@DataJpaTest` her testi bir transaction içinde çalıştırır ve sonunda rollback yapar; testler birbirinin verisini görmez.

## 6. Flyway migration'larını testlerde çalıştırma

Şemayı `ddl-auto` ile değil migration'larla yönetiyorsanız (önerilen yol budur), testler de aynı migration'larla başlamalıdır. Flyway classpath'teyse Spring Boot container'a bağlanır bağlanmaz `db/migration` altındaki script'leri çalıştırır:

```properties
# src/test/resources/application-test.properties
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

Spring Boot 4'te Flyway desteği için `spring-boot-starter-flyway` kullanılır; PostgreSQL için ayrıca `flyway-database-postgresql` gerekir. `ddl-auto=validate` sayesinde entity'ler ile migration'lar arasındaki uyumsuzluklar testte yakalanır.

## 7. N+1 regresyon testi: sorgu sayısını ölçmek

Hibernate N+1 yazısındaki düzeltmeyi kalıcı hale getirmenin en iyi yolu, çalışan sorgu sayısını test etmektir. Hibernate istatistiklerini test profilinde açın:

```properties
spring.jpa.properties.hibernate.generate_statistics=true
```

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
class PostQueryCountTest {

    @Autowired
    PostRepository postRepository;

    @Autowired
    EntityManagerFactory emf;

    @Test
    void loadsPostsWithCommentsInSingleQuery() {
        // 10 post, her birinde 3 yorum olacak şekilde test verisi hazırlanır...

        Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.clear();

        List<Post> posts = postRepository.findAllWithComments();
        posts.forEach(p -> p.getComments().size());   // lazy koleksiyonlara dokun

        assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
    }
}
```

Biri `JOIN FETCH`'i ya da `@EntityGraph`'ı kaldırırsa sorgu sayısı 11'e çıkar ve test kırılır.

## 8. Container reuse ve singleton container

Her test sınıfı için yeni bir container başlatmak yavaştır. İki yaygın çözüm var:

**Spring context cache:** Aynı konfigürasyonu (`@Import(TestcontainersConfiguration.class)`) kullanan test sınıfları aynı Spring context'ini, dolayısıyla aynı container'ı paylaşır. Test sınıflarında gereksiz `@MockitoBean` ya da farklı property'ler kullanmak context'i böler; bunu en aza indirin.

**Lokal geliştirme için reuse:** Container'ın test çalıştırmaları arasında da ayakta kalması için:

```java
return new PostgreSQLContainer("postgres:17-alpine").withReuse(true);
```

```properties
# ~/.testcontainers.properties
testcontainers.reuse.enable=true
```

Reuse yalnızca bu ayar açık makinelerde çalışır; CI'da kapalı bırakıp her çalıştırmada temiz container kullanmak daha güvenlidir. Reuse açıkken veriler çalıştırmalar arasında kalacağı için testlerinizin kendi verisini temizlediğinden emin olun.

## 9. Eski yöntem: @DynamicPropertySource

`@ServiceConnection` öncesinde, ya da desteklenmeyen bir servis için, container bilgileri property olarak verilir:

```java
@SpringBootTest
@Testcontainers
class LegacyStyleIT {

    @Container
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

Çalışır ama her servis için property adlarını bilmeniz gerekir; mümkün olan her yerde `@ServiceConnection`'ı tercih edin.

## 10. Uygulamayı lokalde container'larla çalıştırma

Aynı konfigürasyonu geliştirme sırasında da kullanabilirsiniz. `src/test/java` altında bir `main` metodu tanımlayın:

```java
public class TestApplication {

    public static void main(String[] args) {
        SpringApplication.from(Application::main)
                .with(TestcontainersConfiguration.class)
                .run(args);
    }
}
```

IDE'den `TestApplication`'ı çalıştırdığınızda PostgreSQL container'ı başlar ve uygulama ona bağlanır; ekipteki herkes lokalde veritabanı kurmadan aynı ortamla çalışır. Maven ile `./mvnw spring-boot:test-run`, Gradle ile `./gradlew bootTestRun` aynı işi yapar.

## 11. CI'da çalıştırma

GitHub Actions'ın `ubuntu-latest` runner'larında Docker hazır gelir; ek bir kurulum gerekmez:

```yaml
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: 25
    cache: maven

- name: Test
  run: ./mvnw -B verify
```

Pipeline kurulumunun ayrıntıları için GitHub Actions ile CI/CD yazısına bakabilirsiniz. Birkaç ipucu:

- Image'ları sabit etiketle kullanın (`postgres:17-alpine`), `latest` kullanmayın.
- Unit testleri (`*Test`) ve container'lı testleri (`*IT`) ayırırsanız, Surefire/Failsafe ile hızlı geri bildirim alırsınız.
- macOS/Windows geliştiricilerinde Docker Desktop ya da uyumlu bir alternatif gerekir.

## Sonuç

Testcontainers ile H2'nin "testte geçti, production'da patladı" sorunu ortadan kalkar: testleriniz gerçek PostgreSQL'e, gerçek migration'larla ve gerçek lock davranışıyla çalışır. Spring Boot'un `@ServiceConnection` desteği konfigürasyonu tek bir bean'e indirir; aynı bean'i lokal geliştirme için de kullanabilirsiniz. Hibernate ve Spring serisindeki N+1, transaction ve locking konularını bu altyapıyla test ederek düzeltmelerinizin kalıcı olmasını sağlayın.
