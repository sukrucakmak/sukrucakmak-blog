---
title: "Java 25 LTS: What Changed Since Java 21?"
description: "The features that became final between Java 21 and 25 — unnamed variables, stream gatherers, compact source files, scoped values, flexible constructor bodies, the AOT cache and compact object headers."
date: 2026-11-17
tags: [java, guide]
translation: /blog/java-25-features
---

## Introduction

Java 25 is the LTS (long-term support) release after Java 21. Many features that arrived as previews in Java 22, 23 and 24 have since become final or matured. This post follows up on the Java 21 post and focuses on the changes a project moving from 21 to 25 will notice in day-to-day code and at runtime.

```bash
java -version          # openjdk version "25.x"
```

## 1. What became final in Java 22–24

### Unnamed variables and patterns (JEP 456)

Unused variables can now be marked with `_`. It improves readability and says "I am deliberately not using this value":

```java
try {
    int port = Integer.parseInt(value);
} catch (NumberFormatException _) {
    log.warn("invalid port: {}", value);
}

for (var _ : List.of(1, 2, 3)) {
    counter.increment();
}

map.forEach((_, v) -> process(v));

// Components you don't care about in record patterns
if (obj instanceof Point(var x, _)) {
    System.out.println("x = " + x);
}
```

### Stream gatherers (JEP 485)

With `Stream.gather(...)` you can write your own intermediate operations. Built-in ones live in `java.util.stream.Gatherers`:

```java
// Fixed-size windows: [1,2,3], [4,5,6], [7]
Stream.of(1, 2, 3, 4, 5, 6, 7)
      .gather(Gatherers.windowFixed(3))
      .toList();

// Sliding windows: [1,2], [2,3], [3,4]
Stream.of(1, 2, 3, 4)
      .gather(Gatherers.windowSliding(2))
      .toList();

// Running total: 1, 3, 6, 10
Stream.of(1, 2, 3, 4)
      .gather(Gatherers.scan(() -> 0, Integer::sum))
      .toList();

// Fold into a single result
Stream.of("a", "b", "c")
      .gather(Gatherers.fold(() -> "", String::concat))
      .findFirst();          // Optional["abc"]

// At most 8 concurrent calls, on virtual threads, order preserved
urls.stream()
    .gather(Gatherers.mapConcurrent(8, this::fetch))
    .toList();
```

`mapConcurrent` is a much better fit than `parallelStream()` for parallelizing I/O-heavy work (such as HTTP calls) with bounded concurrency.

### No more synchronized pinning on virtual threads (JEP 491)

In Java 21, a blocking call inside a `synchronized` block pinned the virtual thread to its carrier thread. Java 24 removed that limitation; older libraries that use `synchronized` (JDBC drivers included) now work fine with virtual threads. Pinning remains only in rare cases such as native code calls.

### Others

| JEP | Feature | Short description |
| --- | --- | --- |
| 454 | Foreign Function & Memory API | Call native libraries and manage off-heap memory without JNI |
| 458 | Multi-file source launch | `java Main.java` now also compiles other source files in the same directory |
| 467 | Markdown doc comments | Javadoc comments can be written in Markdown with `///` |
| 483 | AOT class loading & linking | Loaded/linked classes are cached, startup gets faster |
| 486 | Security Manager permanently disabled | `-Djava.security.manager` can no longer be used |

A Markdown doc comment example:

```java
/// Finds a user by **id**.
///
/// - `id`: the user to look up
/// - Returns an empty `Optional` if the user doesn't exist.
Optional<User> findById(long id);
```

## 2. Compact source files and instance main (JEP 512)

For small programs, scripts and teaching code, the class declaration and `public static void main(String[] args)` are no longer required:

```java
// Hello.java
void main() {
    String name = IO.readln("Your name: ");
    IO.println("Hello, " + name);
}
```

```bash
java Hello.java
```

The new `java.lang.IO` class provides `println`, `print` and `readln`. Compact source files automatically import every package of the `java.base` module, so you can use `List`, `Map`, `Files` and friends without imports.

## 3. Module import declarations (JEP 511)

You can import every package a module exports with a single line. Your project does not need to be modular (module-info.java):

```java
import module java.base;      // java.util, java.io, java.time, java.nio.file ...
import module java.sql;

public class Report {
    List<String> lines = new ArrayList<>();
    LocalDate today = LocalDate.now();
}
```

On name clashes (for example `java.util.Date` vs `java.sql.Date`), a single-type import always wins.

## 4. Flexible constructor bodies (JEP 513)

You can write code before the `super(...)` or `this(...)` call, as long as it doesn't touch `this`. Validation and argument preparation now live in a natural place:

```java
public class PositiveAmount extends Amount {

    public PositiveAmount(BigDecimal value) {
        if (value.signum() <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
        var normalized = value.setScale(2, RoundingMode.HALF_UP);
        super(normalized);
    }
}
```

Previously this kind of validation required static helper methods. A subclass can also assign its fields before `super(...)`, so overridden methods called from the superclass constructor no longer see half-initialized fields.

## 5. Scoped values (JEP 506)

An immutable, bounded-lifetime, virtual-thread-friendly alternative to `ThreadLocal`. The value is only visible for the duration of the `run`/`call` block and is cleaned up automatically:

```java
private static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

void handle(Request request) {
    User user = authenticate(request);
    ScopedValue.where(CURRENT_USER, user)
               .run(() -> orderService.process(request));
}

// Anywhere down the call chain
void audit(String action) {
    User user = CURRENT_USER.get();
    log.info("{} -> {}", user.name(), action);
}

// Value-returning variant
Invoice invoice = ScopedValue.where(CURRENT_USER, user)
                             .call(() -> billing.createInvoice());
```

With millions of virtual threads, the memory cost of `ThreadLocal` and the risk of forgetting to clean it up both go away.

## 6. Performance and runtime

### AOT cache: command-line ergonomics and method profiling (JEP 514, 515)

The AOT cache introduced in Java 24 can now be created in a single step. Do a "training" run first, then start with the cache:

```bash
# 1) Training run: app.aot is written when the app exits
java -XX:AOTCacheOutput=app.aot -jar app.jar

# 2) Start in production with the cache
java -XX:AOTCache=app.aot -jar app.jar
```

With JEP 515 the cache also contains method profiles collected during training, so the JIT compiler optimizes hot methods sooner. For startup-heavy applications such as Spring Boot, the startup gains are significant.

### Compact object headers (JEP 519)

Object headers shrink from 12 bytes to 8 bytes on 64-bit systems. Applications with many small objects see a noticeable drop in heap usage:

```bash
java -XX:+UseCompactObjectHeaders -jar app.jar
```

It is no longer experimental in Java 25, but it is off by default; you have to enable it explicitly.

### Other runtime changes

- **Generational Shenandoah (JEP 521):** the generational mode of Shenandoah GC is now final.
- **JFR (JEP 518, 520):** safer stack sampling with cooperative sampling; method timing & tracing to measure specific methods without changing code.
- **32-bit x86 port removed (JEP 503).**
- **KDF API (JEP 510):** a standard `javax.crypto.KDF` API for key derivation functions such as HKDF.

## 7. Preview features

### Structured concurrency (fifth preview)

Manages related subtasks as a single unit: if one fails, the others are cancelled and no thread leaks.

```java
Response handle(long userId) throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        Subtask<User> user    = scope.fork(() -> userService.find(userId));
        Subtask<List<Order>> orders = scope.fork(() -> orderService.findByUser(userId));

        scope.join();        // waits for both; throws if one fails

        return new Response(user.get(), orders.get());
    }
}
```

Use a `Joiner` for other strategies, for example `StructuredTaskScope.open(Joiner.allSuccessfulOrThrow())`.

### Other previews

- **Primitive types in patterns (JEP 507):** match on primitive types like `int` and `double` in `switch` and `instanceof`.
- **Stable values (JEP 502):** lazily initialized values that are set once and can be optimized by the JVM like constants.
- **PEM encodings (JEP 470):** an API for reading/writing keys and certificates in PEM format.

```bash
javac --release 25 --enable-preview Main.java
java --enable-preview Main
```

Don't use preview features in production code; their APIs may change in later releases.

## 8. Migrating from Java 21 to 25

| Step | Note |
| --- | --- |
| JDK | Install an OpenJDK 25 distribution such as Temurin, Corretto or Zulu |
| Maven | `<maven.compiler.release>25</maven.compiler.release>` |
| Gradle | `java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }` |
| Spring Boot | 3.5.x or 4.0+ |
| Lombok, Mockito, ByteBuddy | Upgrade to recent versions that support Java 25 |
| Docker | A base image such as `eclipse-temurin:25-jre` |
| Security Manager | Remove any code or flags that rely on it |

## Conclusion

Java 25 matures the foundation laid by Java 21. With pinning gone from virtual threads, plus scoped values and structured concurrency, concurrent code becomes safer; stream gatherers, unnamed variables and flexible constructor bodies simplify everyday code; and the AOT cache and compact object headers give startup and memory gains without code changes. If you're on Java 21, the upgrade is usually just a few dependency bumps; if you're on Java 17 or older, targeting 25 directly is the sensible choice.
