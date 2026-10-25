---
title: "What's New in Java 21: Virtual Threads, Records and Pattern Matching"
description: "The Java 21 LTS features that change day-to-day code the most — virtual threads, records, switch pattern matching, record patterns, sealed classes and sequenced collections."
date: 2026-11-01
tags: [java, guide]
translation: /blog/java-21-features
---

## Introduction

Java 21 is the LTS (long-term support) release after Java 17 and the most common target for projects moving off Java 11/17. Several of the features that landed between 17 and 21 directly change how we write Java: less boilerplate, safer type checks, and virtual threads that make the thread-per-request model viable again.

This post follows up on the Java 11 and beyond post and focuses on the features that are **final** in Java 21.

```bash
java -version          # openjdk version "21.x"
```

## 1. Virtual threads (JEP 444)

Classic platform threads map one-to-one onto OS threads; each reserves about 1 MB of stack and spawning thousands is expensive. Virtual threads are lightweight threads managed by the JVM: you can start millions, and while waiting on I/O (a database, an HTTP call) they release the underlying OS thread for other work.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        int id = i;
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));   // simulated blocking I/O
            return id;
        });
    }
}   // try-with-resources waits for all tasks to finish
```

10,000 tasks finish in about a second; the same code on a fixed-size platform thread pool would take minutes.

To start a single virtual thread:

```java
Thread.startVirtualThread(() -> System.out.println("hello"));
Thread.ofVirtual().name("worker-", 0).start(task);
```

In Spring Boot 3.2+ apps it's one line:

```properties
spring.threads.virtual.enabled=true
```

Things to watch out for:

- Virtual threads help **I/O-bound** work; they don't speed up CPU-bound computation.
- Don't pool virtual threads; creating a new one per task is the intended use.
- In Java 21, a blocking call inside a `synchronized` block **pins** the virtual thread to its carrier thread. Prefer `ReentrantLock` in hot critical sections. (This limitation was removed in Java 24.)
- Holding large objects in `ThreadLocal` can become a memory problem across millions of threads.

## 2. Records

Final since Java 16, records remove the need to write constructors, getters, `equals`, `hashCode` and `toString` for classes that just carry data:

```java
public record User(Long id, String name, String email) { }

var user = new User(1L, "Şükrü", "sukru@example.com");
user.name();            // accessor: name(), not getName()
System.out.println(user);   // User[id=1, name=Şükrü, email=sukru@example.com]
```

A compact constructor for validation:

```java
public record Money(BigDecimal amount, String currency) {
    public Money {
        if (amount.signum() < 0) throw new IllegalArgumentException("negative amount");
        currency = currency.toUpperCase();
    }
}
```

Records are immutable and `final`; ideal for DTOs, API responses and map keys. They can't be used as JPA entities.

## 3. Pattern matching for switch (JEP 441)

`switch` can now match on types, bind the variable directly, and add conditions with `when`:

```java
static String describe(Object obj) {
    return switch (obj) {
        case null                      -> "null";
        case Integer i when i > 100    -> "big number: " + i;
        case Integer i                 -> "number: " + i;
        case String s when s.isBlank() -> "blank string";
        case String s                  -> "string: " + s;
        case List<?> list              -> "list, size " + list.size();
        default                        -> "unknown: " + obj.getClass().getSimpleName();
    };
}
```

Compare with the old way:

```java
if (obj instanceof Integer) {
    Integer i = (Integer) obj;
    ...
} else if (obj instanceof String) {
    ...
}
```

Thanks to `case null`, you no longer need a separate null check before the switch.

## 4. Record patterns (JEP 440)

Records can be deconstructed into their components while matching, including nested structures:

```java
record Point(int x, int y) { }
record Line(Point start, Point end) { }

static String where(Object obj) {
    return switch (obj) {
        case Point(int x, int y) when x == 0 && y == 0 -> "origin";
        case Point(var x, var y)                        -> "point (" + x + ", " + y + ")";
        case Line(Point(var x1, var y1), Point(var x2, var y2))
            -> "line of length " + Math.hypot(x2 - x1, y2 - y1);
        default -> "unknown";
    };
}
```

It works with `instanceof` too:

```java
if (obj instanceof Point(int x, int y)) {
    System.out.println(x + y);
}
```

## 5. Sealed classes and exhaustive switches

Final since Java 17, sealed classes restrict which subtypes a type can have. Combined with pattern matching, the compiler checks that every case is handled and no `default` is needed:

```java
public sealed interface PaymentResult
        permits Success, Declined, Failed { }

public record Success(String transactionId) implements PaymentResult { }
public record Declined(String reason) implements PaymentResult { }
public record Failed(Exception error) implements PaymentResult { }

String message = switch (result) {
    case Success s  -> "Payment received: " + s.transactionId();
    case Declined d -> "Declined: " + d.reason();
    case Failed f   -> "Error: " + f.error().getMessage();
};
```

If a new type is added to `PaymentResult` tomorrow, every switch you haven't updated becomes a **compile error**. A very powerful tool for modeling error types and state machines.

## 6. Sequenced collections (JEP 431)

Ordered collections get a common API for the first and last elements:

```java
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();       // "a"   (was list.get(0))
list.getLast();        // "c"   (was list.get(list.size() - 1))
list.addFirst("z");
list.removeLast();
list.reversed();       // reversed view

LinkedHashMap<String, Integer> map = new LinkedHashMap<>();
map.put("one", 1);
map.put("two", 2);
map.firstEntry();      // one=1
map.lastEntry();       // two=2
```

`List`, `Deque`, `LinkedHashSet`, `LinkedHashMap`, `TreeSet` and `TreeMap` implement these interfaces (`SequencedCollection`, `SequencedMap`).

## 7. Other small but useful additions

```java
// String
"hello world".indexOf('o', 2, 8);        // search within a range
new StringBuilder().repeat("-", 20);     // "--------------------"

// Math
Math.clamp(150, 0, 100);                 // 100

// Character
Character.isEmoji(0x1F600);              // true
```

Java 21 also brought **Generational ZGC**: worth trying with `-XX:+UseZGC -XX:+ZGenerational` for latency-sensitive apps.

## 8. Preview features

Some features exist in Java 21 only as previews and are enabled with `--enable-preview`: string templates (later withdrawn), unnamed classes and instance main methods, structured concurrency, scoped values. Don't rely on preview features in production code; they can change or be removed in the next release.

```bash
javac --release 21 --enable-preview Main.java
java --enable-preview Main
```

## 9. Moving from Java 17 to 21

| Step | Note |
| --- | --- |
| JDK | Install an OpenJDK 21 distribution such as Temurin, Corretto or Zulu |
| Maven | `<maven.compiler.release>21</maven.compiler.release>` |
| Gradle | `java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }` |
| Spring Boot | 3.2+ for virtual thread support |
| Lombok, Mockito, ByteBuddy | Upgrade to current versions that support Java 21 |
| Docker | A base image such as `eclipse-temurin:21-jre` |

## Conclusion

Java 21 brings several long-awaited features together in one LTS release. You can model data more clearly with records and sealed types, drop `instanceof`/cast chains with pattern matching, and get high concurrency with virtual threads without switching to reactive code. If you're on Java 17, the upgrade is usually just a few dependency bumps; if you're on Java 8/11, this is the best release to jump to.
