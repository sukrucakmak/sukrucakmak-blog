---
title: "Java 21 Yenilikleri: Virtual Threads, Records ve Pattern Matching"
description: "Java 21 LTS ile gelen ve günlük kodu en çok değiştiren özellikler — virtual threads, record'lar, switch pattern matching, record pattern'leri, sealed sınıflar ve sequenced collections."
date: 2026-11-01
tags: [java, rehber]
translation: /en/blog/java-21-features
---

## Giriş

Java 21, Java 17'den sonraki LTS (uzun süreli destek) sürümüdür ve Java 11/17'den geçiş yapan projeler için en çok hedeflenen sürümdür. Java 17 ile 21 arasında gelen özelliklerin bir kısmı, Java kodunu yazma şeklimizi doğrudan değiştiriyor: daha az boilerplate, daha güvenli tip kontrolü ve thread başına bir istek modelini yeniden mümkün kılan virtual thread'ler.

Bu yazı, Java 11 ve sonrası yazısının devamı niteliğinde; Java 21'de **kalıcı (final)** hale gelen özelliklere odaklanıyor.

```bash
java -version          # openjdk version "21.x"
```

## 1. Virtual threads (JEP 444)

Klasik platform thread'leri işletim sistemi thread'lerine birebir karşılık gelir; her biri yaklaşık 1 MB stack ayırır ve binlercesini açmak pahalıdır. Virtual thread'ler JVM tarafından yönetilen hafif thread'lerdir: milyonlarcası açılabilir ve bir I/O beklemesinde (veritabanı, HTTP çağrısı) altındaki işletim sistemi thread'ini başka işe bırakırlar.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        int id = i;
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));   // bloklayan I/O simülasyonu
            return id;
        });
    }
}   // try-with-resources: tüm görevlerin bitmesini bekler
```

10.000 görev yaklaşık 1 saniyede biter; aynı kod sabit boyutlu bir platform thread havuzuyla dakikalar sürerdi.

Tek bir virtual thread başlatmak için:

```java
Thread.startVirtualThread(() -> System.out.println("merhaba"));
Thread.ofVirtual().name("worker-", 0).start(task);
```

Spring Boot 3.2+ uygulamalarında tek satırla açılır:

```properties
spring.threads.virtual.enabled=true
```

Dikkat edilmesi gerekenler:

- Virtual thread'ler **I/O ağırlıklı** işlerde fayda sağlar; CPU ağırlıklı hesaplamayı hızlandırmaz.
- Virtual thread'leri havuzlamayın; her görev için yenisini açmak doğru kullanımdır.
- Java 21'de `synchronized` blok içinde bloklayan bir çağrı, virtual thread'i taşıyıcı thread'e **sabitler (pinning)**. Sık çalışan kritik bölgelerde `ReentrantLock` tercih edin. (Bu kısıt Java 24 ile kaldırıldı.)
- `ThreadLocal` ile büyük nesneler tutmak milyonlarca thread'de bellek sorununa dönüşebilir.

## 2. Records

Java 16'da kalıcı hale gelen record'lar, sadece veri taşıyan sınıflar için constructor, getter, `equals`, `hashCode` ve `toString` yazma ihtiyacını ortadan kaldırır:

```java
public record User(Long id, String name, String email) { }

var user = new User(1L, "Şükrü", "sukru@example.com");
user.name();            // getter: getName() değil name()
System.out.println(user);   // User[id=1, name=Şükrü, email=sukru@example.com]
```

Doğrulama için kompakt constructor:

```java
public record Money(BigDecimal amount, String currency) {
    public Money {
        if (amount.signum() < 0) throw new IllegalArgumentException("negatif tutar");
        currency = currency.toUpperCase();
    }
}
```

Record'lar değiştirilemez (immutable) ve `final`'dır; DTO'lar, API yanıtları ve map anahtarları için idealdir. JPA entity'si olarak ise kullanılamazlar.

## 3. Switch için pattern matching (JEP 441)

`switch` artık tip üzerinde eşleşebilir, değişkeni doğrudan bağlar ve `when` ile koşul ekleyebilir:

```java
static String describe(Object obj) {
    return switch (obj) {
        case null                      -> "null";
        case Integer i when i > 100    -> "büyük sayı: " + i;
        case Integer i                 -> "sayı: " + i;
        case String s when s.isBlank() -> "boş metin";
        case String s                  -> "metin: " + s;
        case List<?> list              -> "liste, boyut " + list.size();
        default                        -> "bilinmeyen: " + obj.getClass().getSimpleName();
    };
}
```

Eski yöntemle karşılaştırın:

```java
if (obj instanceof Integer) {
    Integer i = (Integer) obj;
    ...
} else if (obj instanceof String) {
    ...
}
```

`case null` desteği sayesinde switch öncesi ayrı bir null kontrolüne de gerek kalmaz.

## 4. Record pattern'leri (JEP 440)

Record'ları eşleşme sırasında doğrudan bileşenlerine ayırabilirsiniz; iç içe yapılar da desteklenir:

```java
record Point(int x, int y) { }
record Line(Point start, Point end) { }

static String where(Object obj) {
    return switch (obj) {
        case Point(int x, int y) when x == 0 && y == 0 -> "orijin";
        case Point(var x, var y)                        -> "nokta (" + x + ", " + y + ")";
        case Line(Point(var x1, var y1), Point(var x2, var y2))
            -> "çizgi uzunluğu " + Math.hypot(x2 - x1, y2 - y1);
        default -> "bilinmiyor";
    };
}
```

`instanceof` ile de çalışır:

```java
if (obj instanceof Point(int x, int y)) {
    System.out.println(x + y);
}
```

## 5. Sealed sınıflar ve exhaustive switch

Java 17'de kalıcı hale gelen sealed sınıflar, bir tipin hangi alt tiplere sahip olabileceğini sınırlar. Pattern matching ile birleşince derleyici tüm durumların ele alındığını kontrol eder ve `default` gerekmez:

```java
public sealed interface PaymentResult
        permits Success, Declined, Failed { }

public record Success(String transactionId) implements PaymentResult { }
public record Declined(String reason) implements PaymentResult { }
public record Failed(Exception error) implements PaymentResult { }

String message = switch (result) {
    case Success s  -> "Ödeme alındı: " + s.transactionId();
    case Declined d -> "Reddedildi: " + d.reason();
    case Failed f   -> "Hata: " + f.error().getMessage();
};
```

Yarın `PaymentResult`'a yeni bir tip eklenirse, bu switch'i güncellemediğiniz her yer **derleme hatası** verir. Hata türlerini ve durum makinelerini modellemek için çok güçlü bir araçtır.

## 6. Sequenced collections (JEP 431)

Sırası olan koleksiyonlarda ilk/son elemana erişim için ortak bir API geldi:

```java
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();       // "a"   (eskiden list.get(0))
list.getLast();        // "c"   (eskiden list.get(list.size() - 1))
list.addFirst("z");
list.removeLast();
list.reversed();       // ters sıralı görünüm

LinkedHashMap<String, Integer> map = new LinkedHashMap<>();
map.put("bir", 1);
map.put("iki", 2);
map.firstEntry();      // bir=1
map.lastEntry();       // iki=2
```

`List`, `Deque`, `LinkedHashSet`, `LinkedHashMap`, `TreeSet`, `TreeMap` bu arayüzleri (`SequencedCollection`, `SequencedMap`) uygular.

## 7. Diğer küçük ama faydalı eklemeler

```java
// String
"merhaba dünya".indexOf('a', 2, 8);      // aralık içinde arama
new StringBuilder().repeat("-", 20);     // "--------------------"

// Math
Math.clamp(150, 0, 100);                 // 100

// Character
Character.isEmoji(0x1F600);              // true
```

Ayrıca Java 21'de **Generational ZGC** geldi: düşük gecikme isteyen uygulamalarda `-XX:+UseZGC -XX:+ZGenerational` ile denenebilir.

## 8. Önizleme (preview) özellikleri

Bazı özellikler Java 21'de sadece önizleme olarak bulunur ve `--enable-preview` ile açılır: string templates (daha sonra geri çekildi), unnamed classes ve instance main metodu, structured concurrency, scoped values. Production kodunda önizleme özelliklerine güvenmeyin; bir sonraki sürümde değişebilir ya da kaldırılabilirler.

```bash
javac --release 21 --enable-preview Main.java
java --enable-preview Main
```

## 9. Java 17'den 21'e geçiş

| Adım | Not |
| --- | --- |
| JDK | Temurin, Corretto, Zulu gibi bir OpenJDK 21 dağıtımı kurun |
| Maven | `<maven.compiler.release>21</maven.compiler.release>` |
| Gradle | `java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }` |
| Spring Boot | Virtual thread desteği için 3.2+ |
| Lombok, Mockito, ByteBuddy | Java 21 destekleyen güncel sürümlere yükseltin |
| Docker | `eclipse-temurin:21-jre` gibi bir base image |

## Sonuç

Java 21, uzun zamandır beklenen birkaç özelliği tek bir LTS sürümünde birleştiriyor. Records ve sealed tiplerle veriyi daha net modellemek, pattern matching ile `instanceof`/cast zincirlerinden kurtulmak ve virtual thread'lerle reaktif koda geçmeden yüksek eşzamanlılık elde etmek mümkün. Java 17 kullanıyorsanız geçiş genelde birkaç bağımlılık güncellemesinden ibarettir; Java 8/11'deyseniz ise atlamak için en iyi hedef budur.
