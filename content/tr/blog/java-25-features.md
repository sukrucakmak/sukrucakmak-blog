---
title: "Java 25 LTS: Java 21'den Bu Yana Neler Değişti?"
description: "Java 21'den 25'e gelen ve kalıcı hale gelen özellikler — unnamed değişkenler, stream gatherers, compact source dosyaları, scoped values, flexible constructor bodies, AOT cache ve compact object headers."
date: 2026-11-17
tags: [java, rehber]
translation: /en/blog/java-25-features
---

## Giriş

Java 25, Java 21'den sonraki LTS (uzun süreli destek) sürümüdür. Arada geçen 22, 23 ve 24 sürümlerinde önizleme olarak gelen birçok özellik ya kalıcı hale geldi ya da olgunlaştı. Bu yazı, Java 21 yenilikleri yazısının devamı niteliğinde; 21'den 25'e geçen bir projenin günlük kodda ve çalışma zamanında fark edeceği değişikliklere odaklanıyor.

```bash
java -version          # openjdk version "25.x"
```

## 1. Java 22–24 arasında kalıcı hale gelenler

### Unnamed değişkenler ve pattern'ler (JEP 456)

Kullanılmayan değişkenler artık `_` ile işaretlenebilir. Hem okunabilirliği artırır hem de "bu değeri bilerek kullanmıyorum" mesajını verir:

```java
try {
    int port = Integer.parseInt(value);
} catch (NumberFormatException _) {
    log.warn("geçersiz port: {}", value);
}

for (var _ : List.of(1, 2, 3)) {
    counter.increment();
}

map.forEach((_, v) -> process(v));

// Record pattern'lerinde ilgilenmediğiniz bileşenler
if (obj instanceof Point(var x, _)) {
    System.out.println("x = " + x);
}
```

### Stream gatherers (JEP 485)

`Stream.gather(...)` ile kendi ara (intermediate) işlemlerinizi yazabilirsiniz. Hazır gelenler `java.util.stream.Gatherers` içinde:

```java
// Sabit boyutlu pencereler: [1,2,3], [4,5,6], [7]
Stream.of(1, 2, 3, 4, 5, 6, 7)
      .gather(Gatherers.windowFixed(3))
      .toList();

// Kayan pencereler: [1,2], [2,3], [3,4]
Stream.of(1, 2, 3, 4)
      .gather(Gatherers.windowSliding(2))
      .toList();

// Kümülatif toplam: 1, 3, 6, 10
Stream.of(1, 2, 3, 4)
      .gather(Gatherers.scan(() -> 0, Integer::sum))
      .toList();

// Tek bir sonuca katlama
Stream.of("a", "b", "c")
      .gather(Gatherers.fold(() -> "", String::concat))
      .findFirst();          // Optional["abc"]

// En fazla 8 eşzamanlı çağrı, virtual thread'lerle, sıra korunur
urls.stream()
    .gather(Gatherers.mapConcurrent(8, this::fetch))
    .toList();
```

`mapConcurrent`, I/O ağırlıklı işleri (HTTP çağrıları gibi) sınırlı eşzamanlılıkla paralelleştirmek için `parallelStream()`'den çok daha uygundur.

### Virtual thread'lerde synchronized pinning sorunu bitti (JEP 491)

Java 21'de `synchronized` blok içinde bloklayan bir çağrı virtual thread'i taşıyıcı thread'e sabitliyordu. Java 24 ile bu kısıt kalktı; `synchronized` kullanan eski kütüphaneler (JDBC sürücüleri dahil) artık virtual thread'lerle sorunsuz çalışır. Yalnızca native kod çağrıları gibi nadir durumlarda pinning devam eder.

### Diğerleri

| JEP | Özellik | Kısa açıklama |
| --- | --- | --- |
| 454 | Foreign Function & Memory API | JNI olmadan native kütüphane çağırma ve off-heap bellek yönetimi |
| 458 | Multi-file source launch | `java Main.java` artık aynı dizindeki diğer kaynak dosyalarını da derler |
| 467 | Markdown doc comments | `///` ile Javadoc yorumları Markdown olarak yazılabilir |
| 483 | AOT class loading & linking | Sınıfların yüklenmiş/bağlanmış hali önbelleğe alınır, açılış hızlanır |
| 486 | Security Manager kalıcı olarak devre dışı | `-Djava.security.manager` artık kullanılamaz |

Markdown doc comment örneği:

```java
/// Kullanıcıyı **id** ile bulur.
///
/// - `id`: aranacak kullanıcı
/// - Kullanıcı yoksa boş `Optional` döner.
Optional<User> findById(long id);
```

## 2. Compact source dosyaları ve instance main (JEP 512)

Küçük programlar, script'ler ve öğretim amaçlı kod için sınıf tanımı ve `public static void main(String[] args)` zorunluluğu kalktı:

```java
// Hello.java
void main() {
    String name = IO.readln("Adınız: ");
    IO.println("Merhaba, " + name);
}
```

```bash
java Hello.java
```

Yeni `java.lang.IO` sınıfı `println`, `print` ve `readln` metotlarını sunar. Compact source dosyalarında `java.base` modülündeki tüm paketler otomatik olarak import edilir; `List`, `Map`, `Files` gibi sınıfları import etmeden kullanabilirsiniz.

## 3. Module import declarations (JEP 511)

Bir modülün dışa açtığı tüm paketleri tek satırla import edebilirsiniz. Projenizin modüler (module-info.java) olması gerekmez:

```java
import module java.base;      // java.util, java.io, java.time, java.nio.file ...
import module java.sql;

public class Report {
    List<String> lines = new ArrayList<>();
    LocalDate today = LocalDate.now();
}
```

İsim çakışmalarında (örneğin `java.util.Date` ve `java.sql.Date`) tekil import her zaman önceliklidir.

## 4. Flexible constructor bodies (JEP 513)

`super(...)` veya `this(...)` çağrısından önce, `this`'e dokunmadığınız sürece kod yazabilirsiniz. Doğrulama ve argüman hazırlama artık doğal bir yerde yapılır:

```java
public class PositiveAmount extends Amount {

    public PositiveAmount(BigDecimal value) {
        if (value.signum() <= 0) {
            throw new IllegalArgumentException("tutar pozitif olmalı");
        }
        var normalized = value.setScale(2, RoundingMode.HALF_UP);
        super(normalized);
    }
}
```

Eskiden bu doğrulama için statik yardımcı metotlar yazmak gerekiyordu. Ayrıca alt sınıf, alanlarını `super(...)`'dan önce atayabilir; böylece üst sınıf constructor'ından çağrılan override edilmiş metotlar yarı başlatılmış alan görmez.

## 5. Scoped values (JEP 506)

`ThreadLocal`'in değiştirilemez, sınırlı ömürlü ve virtual thread dostu alternatifi. Değer yalnızca `run`/`call` bloğu süresince geçerlidir ve otomatik temizlenir:

```java
private static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

void handle(Request request) {
    User user = authenticate(request);
    ScopedValue.where(CURRENT_USER, user)
               .run(() -> orderService.process(request));
}

// Çağrı zincirinin herhangi bir yerinde
void audit(String action) {
    User user = CURRENT_USER.get();
    log.info("{} -> {}", user.name(), action);
}

// Değer döndüren versiyon
Invoice invoice = ScopedValue.where(CURRENT_USER, user)
                             .call(() -> billing.createInvoice());
```

Milyonlarca virtual thread ile çalışırken `ThreadLocal`'in bellek maliyeti ve temizlenmeyi unutma riski ortadan kalkar.

## 6. Performans ve çalışma zamanı

### AOT cache: command-line ergonomics ve method profiling (JEP 514, 515)

Java 24'te gelen AOT önbelleği artık tek adımda oluşturulabiliyor. Önce bir "eğitim" çalıştırması yapılır, sonra önbellekle başlatılır:

```bash
# 1) Eğitim çalıştırması: uygulama kapanınca app.aot üretilir
java -XX:AOTCacheOutput=app.aot -jar app.jar

# 2) Production'da önbellekle başlatma
java -XX:AOTCache=app.aot -jar app.jar
```

JEP 515 ile önbellek, eğitim sırasında toplanan metot profillerini de içerir; JIT derleyici sıcak metotları daha erken optimize eder. Spring Boot gibi açılışı ağır uygulamalarda başlangıç süresinde ciddi kazanç sağlar.

### Compact object headers (JEP 519)

Nesne başlıkları 64 bit sistemlerde 12 byte'tan 8 byte'a iner. Küçük nesne yoğun uygulamalarda heap kullanımı belirgin şekilde azalır:

```bash
java -XX:+UseCompactObjectHeaders -jar app.jar
```

Java 25'te artık deneysel değil; ancak varsayılan olarak kapalıdır, açıkça etkinleştirmeniz gerekir.

### Diğer çalışma zamanı değişiklikleri

- **Generational Shenandoah (JEP 521):** Shenandoah GC'nin nesilli modu kalıcı hale geldi.
- **JFR (JEP 518, 520):** Cooperative sampling ile daha güvenli stack örnekleme; method timing & tracing ile belirli metotların süresini kod değiştirmeden ölçme.
- **32-bit x86 portu kaldırıldı (JEP 503).**
- **KDF API (JEP 510):** HKDF gibi anahtar türetme fonksiyonları için standart `javax.crypto.KDF` API'si.

## 7. Önizleme (preview) özellikleri

### Structured concurrency (beşinci önizleme)

Birbiriyle ilişkili alt görevleri tek bir birim olarak yönetir: biri hata verirse diğerleri iptal edilir, hiçbir thread sızmaz.

```java
Response handle(long userId) throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        Subtask<User> user    = scope.fork(() -> userService.find(userId));
        Subtask<List<Order>> orders = scope.fork(() -> orderService.findByUser(userId));

        scope.join();        // ikisini de bekler; biri hata verirse exception fırlatır

        return new Response(user.get(), orders.get());
    }
}
```

Farklı stratejiler için `Joiner` kullanılır; örneğin `StructuredTaskScope.open(Joiner.allSuccessfulOrThrow())`.

### Diğer önizlemeler

- **Primitive types in patterns (JEP 507):** `switch` ve `instanceof` içinde `int`, `double` gibi primitive tiplerle eşleşme.
- **Stable values (JEP 502):** Bir kez atanan, JVM tarafından sabit gibi optimize edilebilen tembel (lazy) değerler.
- **PEM encodings (JEP 470):** Anahtar ve sertifikaları PEM formatında okuma/yazma API'si.

```bash
javac --release 25 --enable-preview Main.java
java --enable-preview Main
```

Önizleme özelliklerini production kodunda kullanmayın; sonraki sürümlerde API değişebilir.

## 8. Java 21'den 25'e geçiş

| Adım | Not |
| --- | --- |
| JDK | Temurin, Corretto, Zulu gibi bir OpenJDK 25 dağıtımı kurun |
| Maven | `<maven.compiler.release>25</maven.compiler.release>` |
| Gradle | `java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }` |
| Spring Boot | 3.5.x veya 4.0+ |
| Lombok, Mockito, ByteBuddy | Java 25 destekleyen güncel sürümlere yükseltin |
| Docker | `eclipse-temurin:25-jre` gibi bir base image |
| Security Manager | Kullanan kod veya bayrak varsa kaldırın |

## Sonuç

Java 25, Java 21'in getirdiği temeli olgunlaştırıyor. Virtual thread'lerdeki pinning sorununun kalkması, scoped values ve structured concurrency ile eşzamanlı kod daha güvenli hale geliyor; stream gatherers, unnamed değişkenler ve flexible constructor bodies günlük kodu sadeleştiriyor; AOT cache ve compact object headers ise kod değiştirmeden açılış süresi ve bellek kazancı sağlıyor. Java 21 kullanıyorsanız geçiş genellikle birkaç bağımlılık güncellemesinden ibarettir; Java 17 veya daha eskisindeyseniz ise doğrudan 25'i hedeflemek en mantıklı seçenektir.
