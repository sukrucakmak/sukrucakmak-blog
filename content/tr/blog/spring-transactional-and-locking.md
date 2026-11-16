---
title: "Spring ve Hibernate ile @Transactional Tuzakları ve Locking"
description: "@Transactional'ın proxy ile nasıl çalıştığı, self-invocation, rollback kuralları, propagation, readOnly, optimistic ve pessimistic locking ile SKIP LOCKED iş kuyruğu deseni."
date: 2026-11-22
tags: [java, spring, hibernate, veritabanı, rehber]
translation: /en/blog/spring-transactional-and-locking
---

## Giriş

`@Transactional` Spring'in en çok kullanılan ve en çok yanlış anlaşılan annotation'ıdır. Bir metodun başına eklemek, çoğu zaman beklendiği gibi çalışır; ama bazı durumlarda hiç transaction açılmaz, hata olduğu halde rollback yapılmaz ya da connection havuzu tükenir. Eşzamanlı güncellemelerde ise doğru locking stratejisi seçilmezse veriler sessizce ezilir.

Bu yazıda en sık karşılaşılan tuzakları ve Hibernate ile locking seçeneklerini örneklerle ele alıyorum.

## 1. @Transactional nasıl çalışır?

Spring, `@Transactional` içeren bir bean için bir **proxy** oluşturur. Dışarıdan gelen çağrı önce proxy'ye gider; proxy transaction'ı açar, gerçek metodu çağırır, sonra commit ya da rollback yapar:

```text
Controller ──► [Proxy: begin tx] ──► OrderService.placeOrder() ──► [Proxy: commit/rollback]
```

Bu modelin doğal sonucu: **proxy'den geçmeyen çağrılar transaction kurallarını görmez.**

## 2. Self-invocation tuzağı

```java
@Service
public class OrderService {

    public void placeOrders(List<OrderRequest> requests) {
        for (var r : requests) {
            placeOrder(r);              // this.placeOrder() — proxy'den geçmez!
        }
    }

    @Transactional
    public void placeOrder(OrderRequest request) { ... }
}
```

`placeOrders` aynı sınıf içinden `placeOrder`'ı çağırdığı için annotation hiç devreye girmez. Çözümler:

- Transactional metodu ayrı bir bean'e taşımak (en temiz yol).
- Programatik transaction için `TransactionTemplate` kullanmak (aşağıda).

Benzer şekilde, varsayılan proxy mekanizmasında `private` metotlar ve `final` metotlar/sınıflar için `@Transactional` etkisizdir. Annotation'ı public servis metotlarına koyun.

## 3. Checked exception'lar varsayılan olarak rollback yapmaz

Spring varsayılan olarak sadece `RuntimeException` ve `Error` durumunda rollback yapar. Checked exception fırlatılırsa transaction **commit edilir**:

```java
@Transactional
public void importFile(Path file) throws IOException {
    repository.save(new ImportJob(file));
    Files.readAllLines(file);   // IOException fırlatırsa kayıt yine commit edilir
}
```

Davranışı açıkça belirtin:

```java
@Transactional(rollbackFor = Exception.class)
public void importFile(Path file) throws IOException { ... }
```

Ayrıca exception'ı metot içinde yakalayıp yutarsanız proxy hatayı hiç görmez ve commit eder.

## 4. readOnly = true

Sadece okuma yapan metotlarda:

```java
@Transactional(readOnly = true)
public List<OrderView> findRecentOrders() { ... }
```

Faydaları:

- Hibernate session'ı flush etmez ve dirty checking için entity snapshot'larını tutması gerekmez; bellek ve CPU tasarrufu sağlar.
- JDBC sürücüsüne read-only ipucu gider; bazı veritabanları bunu optimize eder.
- Routing datasource kullanıyorsanız sorguları read replica'ya yönlendirmek için sinyal olarak kullanılabilir.

Yaygın bir desen: servis sınıfına `@Transactional(readOnly = true)`, yazan metotlara ise `@Transactional` koymak.

## 5. Propagation: REQUIRED ve REQUIRES_NEW

Varsayılan `REQUIRED`: mevcut bir transaction varsa ona katılır, yoksa yenisini açar. `REQUIRES_NEW` ise mevcut transaction'ı askıya alır ve bağımsız yeni bir transaction açar.

Klasik kullanım, ana işlem başarısız olsa bile kalıcı olması gereken audit log'dur:

```java
@Service
public class AuditService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String detail) {
        auditRepository.save(new AuditEntry(action, detail));
    }
}

@Service
public class PaymentService {

    @Transactional
    public void pay(PaymentRequest request) {
        auditService.log("PAYMENT_ATTEMPT", request.id());   // ayrı tx, hemen commit
        ...                                                   // burada hata olursa
    }                                                         // audit kaydı kalır
}
```

Bedeli: dış transaction connection'ını bırakmadan iç transaction **ikinci bir connection** alır. Havuz boyutu 10 ve aynı anda 10 istek varsa, her biri ikinci connection'ı beklerken uygulama kilitlenebilir. `REQUIRES_NEW`'u sık çalışan yollarda dikkatli kullanın ve havuz boyutunu buna göre ayarlayın.

## 6. TransactionTemplate ile programatik transaction

Transaction sınırını kod içinde net çizmek istediğinizde:

```java
@Service
public class ReportService {

    private final TransactionTemplate tx;

    ReportService(PlatformTransactionManager tm) {
        this.tx = new TransactionTemplate(tm);
    }

    public Report generate(Long id) {
        var data = tx.execute(status -> repository.loadReportData(id));
        return renderPdf(data);   // uzun süren iş transaction dışında
    }
}
```

Self-invocation sorunu da yoktur, çünkü proxy'ye ihtiyaç duymaz.

## 7. Dış çağrıları transaction dışında tutun

```java
@Transactional
public void completeOrder(Long id) {
    var order = orderRepository.findById(id).orElseThrow();
    order.complete();
    paymentClient.capture(order.paymentId());   // 5 saniye sürebilir
    mailClient.sendReceipt(order);
}
```

Bu kod HTTP çağrıları boyunca bir veritabanı connection'ını ve satır kilitlerini tutar. Ayrıca mail gönderildikten sonra commit başarısız olursa müşteri gerçekleşmemiş bir sipariş için makbuz alır.

Yan etkileri commit sonrasına taşıyın:

```java
@Transactional
public void completeOrder(Long id) {
    var order = orderRepository.findById(id).orElseThrow();
    order.complete();
    events.publishEvent(new OrderCompleted(order.getId()));
}

@Component
class OrderNotifications {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    void onCompleted(OrderCompleted event) {
        mailClient.sendReceipt(event.orderId());
    }
}
```

Listener sadece transaction başarıyla commit edilirse çalışır. Garantili teslimat gerekiyorsa (uygulama commit ile listener arasında çökebilir) outbox deseni tercih edilmelidir.

## 8. LazyInitializationException ve open-in-view

```text
org.hibernate.LazyInitializationException: could not initialize proxy - no Session
```

Transaction (ve session) kapandıktan sonra lazy bir ilişkiye erişildiğinde oluşur. Spring Boot'un varsayılan `spring.jpa.open-in-view=true` ayarı session'ı view katmanına kadar açık tutarak bu hatayı gizler, ama bedelini controller ve JSON serileştirme sırasında çalışan kontrolsüz sorgularla ödersiniz.

```properties
spring.jpa.open-in-view=false
```

Doğru çözüm, ihtiyaç duyulan veriyi transaction içinde `JOIN FETCH`, `@EntityGraph` veya DTO projection ile yüklemek ve servis katmanından entity yerine DTO döndürmektir.

## 9. Optimistic locking: @Version

İki kullanıcı aynı kaydı aynı anda güncellediğinde, sonra yazan öncekini sessizce ezer (lost update). `@Version` bunu engeller:

```java
@Entity
public class Product {
    @Id @GeneratedValue
    private Long id;
    private int stock;

    @Version
    private long version;
}
```

Hibernate her update'e versiyon kontrolü ekler:

```sql
update product set stock = ?, version = 6 where id = ? and version = 5;
```

Etkilenen satır sayısı 0 ise Spring `ObjectOptimisticLockingFailureException` fırlatır. Çakışmanın nadir olduğu senaryolarda kilit tutmadan tutarlılık sağlar.

Çakışmada tekrar denemek için Spring Framework 7 ile gelen `@Retryable` kullanılabilir:

```java
@Configuration
@EnableResilientMethods
class ResilienceConfig { }

@Service
public class StockFacade {

    private final StockService stockService;

    @Retryable(includes = ObjectOptimisticLockingFailureException.class)
    public void decrease(Long productId, int qty) {
        stockService.decrease(productId, qty);   // @Transactional metot
    }
}
```

Kritik nokta: **retry transaction'ı sarmalamalı, içinde çalışmamalı.** Optimistic lock hatası commit/flush anında oluşur ve o transaction artık rollback-only'dir. Her denemenin yeni bir transaction'da, güncel versiyonu tekrar okuyarak çalışması gerekir. Bu yüzden `@Retryable` ve `@Transactional`'ı aynı metoda değil, ayrı bean'lere koyun.

## 10. Pessimistic locking

Çakışmanın sık olduğu ya da tekrar denemenin pahalı olduğu durumlarda satırı okurken kilitleyin:

```java
public interface AccountRepository extends JpaRepository<Account, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select a from Account a where a.id = :id")
    Optional<Account> findForUpdate(Long id);
}
```

```sql
select ... from account a where a.id = ? for update
```

Kilit transaction sonuna kadar tutulur; bu yüzden metot `@Transactional` olmalı ve kısa sürmeli. Lock timeout ipucunun nasıl uygulandığı veritabanına ve dialect'e bağlıdır; davranışı SQL log'undan doğrulayın. Birden fazla satırı kilitlerken deadlock'ları önlemek için her zaman aynı sırayla (ör. id'ye göre) kilitleyin.

## 11. SKIP LOCKED ile iş kuyruğu

Birden fazla instance'ın aynı tablodan iş çektiği durumlarda, PostgreSQL'in `SKIP LOCKED` özelliği başka bir worker'ın kilitlediği satırları atlar; böylece worker'lar birbirini beklemez ve aynı işi iki kez almaz:

```java
public interface JobRepository extends JpaRepository<Job, Long> {

    @Query(value = """
            select * from job
            where status = 'PENDING'
            order by created_at
            limit :limit
            for update skip locked
            """, nativeQuery = true)
    List<Job> lockNextBatch(int limit);
}

@Transactional
public void processBatch() {
    for (Job job : jobRepository.lockNextBatch(10)) {
        job.markRunning();
    }
}
```

Uzun süren işler için en iyi yöntem, satırı bu şekilde `RUNNING` olarak işaretleyip transaction'ı kapatmak, işi transaction dışında yapmak ve sonucu ayrı bir transaction'da yazmaktır.

## 12. Isolation seviyeleri

| Seviye | Dirty read | Non-repeatable read | Phantom read |
| --- | --- | --- | --- |
| `READ_UNCOMMITTED` | Olabilir | Olabilir | Olabilir |
| `READ_COMMITTED` | Yok | Olabilir | Olabilir |
| `REPEATABLE_READ` | Yok | Yok | Olabilir* |
| `SERIALIZABLE` | Yok | Yok | Yok |

\* PostgreSQL'in `REPEATABLE_READ` uygulaması phantom read'e de izin vermez. PostgreSQL ve Oracle'da varsayılan `READ_COMMITTED`, MySQL InnoDB'de `REPEATABLE_READ`'dir.

```java
@Transactional(isolation = Isolation.SERIALIZABLE)
public void transfer(...) { ... }
```

Yüksek isolation seviyeleri serialization hatalarına yol açabilir; bu durumda da işlemin tekrar denenmesi gerekir. Çoğu uygulama için `READ_COMMITTED` + `@Version` doğru dengedir.

## Sonuç

`@Transactional`'ın bir proxy olduğunu akılda tutmak tuzakların çoğunu açıklar: self-invocation, private metotlar ve yutulan exception'lar. Transaction'ları kısa tutun, dış çağrıları ve yan etkileri commit sonrasına taşıyın, `open-in-view`'ı kapatın. Eşzamanlılık için varsayılan tercih `@Version` ile optimistic locking ve transaction'ı sarmalayan bir retry olmalı; sık çakışan kayıtlarda pessimistic lock, iş kuyruklarında ise `SKIP LOCKED` kullanın.
