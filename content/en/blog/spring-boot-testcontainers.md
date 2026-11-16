---
title: "Testing Spring Boot and JPA with Testcontainers"
description: "Testing against real PostgreSQL instead of H2: @ServiceConnection, @DataJpaTest, Flyway migrations, an N+1 regression test by counting queries, container reuse and running the app locally with containers."
date: 2026-11-26
tags: [java, spring, hibernate, docker, guide]
translation: /blog/spring-boot-testcontainers
---

## Introduction

For many years, the default choice for testing JPA/Hibernate code was an in-memory database like H2: fast, no setup needed. But queries that pass on H2 and blow up on PostgreSQL in production are the price of that convenience.

**Testcontainers** starts a real database (or Redis, Kafka, RabbitMQ...) on Docker during tests and removes it when they finish. Combined with Spring Boot's `@ServiceConnection` support, setup comes down to a few lines. This post shows how to test the examples from the Hibernate and Spring Boot series against a real database.

## 1. Why not H2?

| Topic | H2 | PostgreSQL |
| --- | --- | --- |
| SQL dialect | Has a compatibility mode, but not identical | Same as production |
| `jsonb`, array, `uuid` types | Limited or different behavior | Full support |
| Native queries, window functions | Partial | Full |
| `FOR UPDATE SKIP LOCKED`, lock behavior | Different | Same as production |
| Migrations (Flyway) | May need separate scripts | Same scripts |
| Index and constraint errors | Different messages/behavior | Same |

In short, H2 tests test a database you don't actually use. With Testcontainers, your tests run on the same PostgreSQL version as production.

## 2. Dependencies

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

Spring Boot's dependency management handles the versions; don't write them by hand. Note: with **Testcontainers 2.x**, module artifacts were renamed to `testcontainers-<module>` and some classes moved packages (for example, `PostgreSQLContainer` now lives in `org.testcontainers.postgresql`). In older projects on Testcontainers 1.x, the artifact name is `postgresql`.

Docker (or a compatible runtime such as Podman) must be running on the machine.

## 3. Defining the container as a bean

Since Spring Boot 3.1, the cleanest approach is to define the container as a bean in a test configuration and mark it with `@ServiceConnection`:

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

Thanks to `@ServiceConnection`, `spring.datasource.url`, the username and password are taken from the container automatically; you don't need to write any properties. The container starts with the Spring context and stops when the context closes.

Keep the image tag the same as your production PostgreSQL version.

## 4. Integration test with @SpringBootTest

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
        Long id = orderService.create(new CreateOrder("sukru", List.of("book", "pen")));

        Order order = orderRepository.findWithItemsById(id).orElseThrow();
        assertThat(order.getItems()).hasSize(2);
    }
}
```

> In Spring Boot 4, the test slice annotations (`@DataJpaTest`, `@WebMvcTest`...) moved into per-technology modules and their packages changed. Rather than memorizing import lines, let your IDE resolve them, and make sure the matching `spring-boot-starter-*-test` dependency is on the classpath.

## 5. Repository test with @DataJpaTest

`@DataJpaTest` loads only the JPA layer and by default tries to replace the DataSource with an embedded database. To use the real container, we turn that off:

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
        em.persist(new Post("Draft", "java", false));
        em.flush();

        assertThat(postRepository.findPublishedByTag("java"))
                .extracting(Post::getTitle)
                .containsExactly("Java 25");
    }
}
```

`@DataJpaTest` runs each test in a transaction and rolls it back at the end; tests don't see each other's data.

## 6. Running Flyway migrations in tests

If you manage the schema with migrations rather than `ddl-auto` (the recommended way), tests should start with the same migrations. If Flyway is on the classpath, Spring Boot runs the scripts under `db/migration` as soon as it connects to the container:

```properties
# src/test/resources/application-test.properties
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

In Spring Boot 4, Flyway support comes from `spring-boot-starter-flyway`; for PostgreSQL you also need `flyway-database-postgresql`. With `ddl-auto=validate`, mismatches between entities and migrations are caught in tests.

## 7. N+1 regression test: counting queries

The best way to make the fix from the Hibernate N+1 post stick is to test the number of queries executed. Enable Hibernate statistics in the test profile:

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
        // test data: 10 posts with 3 comments each...

        Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.clear();

        List<Post> posts = postRepository.findAllWithComments();
        posts.forEach(p -> p.getComments().size());   // touch the lazy collections

        assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
    }
}
```

If someone removes the `JOIN FETCH` or `@EntityGraph`, the query count jumps to 11 and the test fails.

## 8. Container reuse and the singleton container

Starting a new container for every test class is slow. There are two common solutions:

**Spring context cache:** Test classes that use the same configuration (`@Import(TestcontainersConfiguration.class)`) share the same Spring context and therefore the same container. Unnecessary `@MockitoBean`s or differing properties in test classes split the context; keep them to a minimum.

**Reuse for local development:** To keep the container up between test runs as well:

```java
return new PostgreSQLContainer("postgres:17-alpine").withReuse(true);
```

```properties
# ~/.testcontainers.properties
testcontainers.reuse.enable=true
```

Reuse only works on machines where this setting is enabled; it's safer to leave it off in CI and use a clean container on every run. With reuse enabled, data persists between runs, so make sure your tests clean up their own data.

## 9. The older way: @DynamicPropertySource

Before `@ServiceConnection`, or for an unsupported service, container details are passed as properties:

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

It works, but you need to know the property names for every service; prefer `@ServiceConnection` wherever possible.

## 10. Running the app locally with containers

You can use the same configuration during development. Define a `main` method under `src/test/java`:

```java
public class TestApplication {

    public static void main(String[] args) {
        SpringApplication.from(Application::main)
                .with(TestcontainersConfiguration.class)
                .run(args);
    }
}
```

When you run `TestApplication` from the IDE, the PostgreSQL container starts and the app connects to it; everyone on the team works with the same environment without installing a database locally. `./mvnw spring-boot:test-run` with Maven and `./gradlew bootTestRun` with Gradle do the same.

## 11. Running in CI

GitHub Actions `ubuntu-latest` runners come with Docker ready; no extra setup is needed:

```yaml
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: 25
    cache: maven

- name: Test
  run: ./mvnw -B verify
```

For the details of setting up the pipeline, see the CI/CD with GitHub Actions post. A few tips:

- Use images with a fixed tag (`postgres:17-alpine`), not `latest`.
- If you separate unit tests (`*Test`) from container tests (`*IT`), you get fast feedback with Surefire/Failsafe.
- Developers on macOS/Windows need Docker Desktop or a compatible alternative.

## Conclusion

Testcontainers removes H2's "passed in tests, blew up in production" problem: your tests run against real PostgreSQL, with real migrations and real lock behavior. Spring Boot's `@ServiceConnection` support reduces the configuration to a single bean, and you can reuse that bean for local development. Test the N+1, transaction and locking topics from the Hibernate and Spring series on this setup to make sure your fixes stay fixed.
