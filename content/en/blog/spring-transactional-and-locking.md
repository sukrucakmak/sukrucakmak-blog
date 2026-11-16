---
title: "@Transactional Pitfalls and Locking with Spring and Hibernate"
description: "How @Transactional works through proxies, self-invocation, rollback rules, propagation, readOnly, optimistic and pessimistic locking, and the SKIP LOCKED job-queue pattern."
date: 2026-11-22
tags: [java, spring, hibernate, database, guide]
translation: /blog/spring-transactional-and-locking
---

## Introduction

`@Transactional` is Spring's most used and most misunderstood annotation. Putting it on a method usually works as expected; but in some cases no transaction is opened at all, an error doesn't trigger a rollback, or the connection pool runs dry. And with concurrent updates, picking the wrong locking strategy means data gets silently overwritten.

This post covers the most common pitfalls and the locking options with Hibernate, with examples.

## 1. How does @Transactional work?

For a bean with `@Transactional`, Spring creates a **proxy**. An external call goes to the proxy first; the proxy opens the transaction, calls the real method, then commits or rolls back:

```text
Controller ──► [Proxy: begin tx] ──► OrderService.placeOrder() ──► [Proxy: commit/rollback]
```

The natural consequence of this model: **calls that don't go through the proxy don't see the transaction rules.**

## 2. The self-invocation pitfall

```java
@Service
public class OrderService {

    public void placeOrders(List<OrderRequest> requests) {
        for (var r : requests) {
            placeOrder(r);              // this.placeOrder() — bypasses the proxy!
        }
    }

    @Transactional
    public void placeOrder(OrderRequest request) { ... }
}
```

Because `placeOrders` calls `placeOrder` from inside the same class, the annotation never kicks in. Fixes:

- Move the transactional method to a separate bean (the cleanest way).
- Use `TransactionTemplate` for programmatic transactions (see below).

Similarly, with the default proxy mechanism `@Transactional` has no effect on `private` methods and on `final` methods/classes. Put the annotation on public service methods.

## 3. Checked exceptions don't roll back by default

By default Spring only rolls back on `RuntimeException` and `Error`. If a checked exception is thrown, the transaction is **committed**:

```java
@Transactional
public void importFile(Path file) throws IOException {
    repository.save(new ImportJob(file));
    Files.readAllLines(file);   // if this throws IOException, the row is still committed
}
```

State the behavior explicitly:

```java
@Transactional(rollbackFor = Exception.class)
public void importFile(Path file) throws IOException { ... }
```

And if you catch and swallow the exception inside the method, the proxy never sees the error and commits.

## 4. readOnly = true

On methods that only read:

```java
@Transactional(readOnly = true)
public List<OrderView> findRecentOrders() { ... }
```

Benefits:

- Hibernate doesn't flush the session and doesn't need to keep entity snapshots for dirty checking, saving memory and CPU.
- A read-only hint is passed to the JDBC driver; some databases optimize for it.
- With a routing datasource it can be used as the signal to send queries to a read replica.

A common pattern: `@Transactional(readOnly = true)` on the service class, and `@Transactional` on the methods that write.

## 5. Propagation: REQUIRED and REQUIRES_NEW

The default `REQUIRED` joins an existing transaction if there is one, otherwise opens a new one. `REQUIRES_NEW` suspends the current transaction and opens an independent new one.

The classic use case is an audit log that must persist even if the main operation fails:

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
        auditService.log("PAYMENT_ATTEMPT", request.id());   // separate tx, commits right away
        ...                                                   // if this fails,
    }                                                         // the audit row stays
}
```

The cost: the inner transaction takes a **second connection** while the outer one still holds its own. With a pool size of 10 and 10 concurrent requests, each waiting for its second connection, the application can deadlock. Use `REQUIRES_NEW` carefully on hot paths and size the pool accordingly.

## 6. Programmatic transactions with TransactionTemplate

When you want to draw the transaction boundary clearly in code:

```java
@Service
public class ReportService {

    private final TransactionTemplate tx;

    ReportService(PlatformTransactionManager tm) {
        this.tx = new TransactionTemplate(tm);
    }

    public Report generate(Long id) {
        var data = tx.execute(status -> repository.loadReportData(id));
        return renderPdf(data);   // long-running work outside the transaction
    }
}
```

There's no self-invocation problem either, since it doesn't rely on a proxy.

## 7. Keep external calls out of transactions

```java
@Transactional
public void completeOrder(Long id) {
    var order = orderRepository.findById(id).orElseThrow();
    order.complete();
    paymentClient.capture(order.paymentId());   // may take 5 seconds
    mailClient.sendReceipt(order);
}
```

This code holds a database connection and row locks for the duration of the HTTP calls. And if the commit fails after the mail is sent, the customer gets a receipt for an order that never happened.

Move side effects to after the commit:

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

The listener only runs if the transaction commits successfully. If you need guaranteed delivery (the application can crash between the commit and the listener), prefer the outbox pattern.

## 8. LazyInitializationException and open-in-view

```text
org.hibernate.LazyInitializationException: could not initialize proxy - no Session
```

It happens when a lazy association is accessed after the transaction (and session) is closed. Spring Boot's default `spring.jpa.open-in-view=true` hides this error by keeping the session open up to the view layer, but you pay for it with uncontrolled queries running in controllers and during JSON serialization.

```properties
spring.jpa.open-in-view=false
```

The right fix is to load the data you need inside the transaction with `JOIN FETCH`, `@EntityGraph` or a DTO projection, and to return DTOs instead of entities from the service layer.

## 9. Optimistic locking: @Version

When two users update the same record at the same time, the later write silently overwrites the earlier one (lost update). `@Version` prevents that:

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

Hibernate adds a version check to every update:

```sql
update product set stock = ?, version = 6 where id = ? and version = 5;
```

If the affected row count is 0, Spring throws `ObjectOptimisticLockingFailureException`. When conflicts are rare, it gives you consistency without holding locks.

To retry on conflict, you can use `@Retryable`, which came with Spring Framework 7:

```java
@Configuration
@EnableResilientMethods
class ResilienceConfig { }

@Service
public class StockFacade {

    private final StockService stockService;

    @Retryable(includes = ObjectOptimisticLockingFailureException.class)
    public void decrease(Long productId, int qty) {
        stockService.decrease(productId, qty);   // @Transactional method
    }
}
```

The key point: **the retry must wrap the transaction, not run inside it.** The optimistic lock failure happens at commit/flush time, and that transaction is now rollback-only. Each attempt must run in a new transaction, re-reading the current version. So put `@Retryable` and `@Transactional` on separate beans, not on the same method.

## 10. Pessimistic locking

When conflicts are frequent or retrying is expensive, lock the row while reading it:

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

The lock is held until the end of the transaction, so the method must be `@Transactional` and short. How the lock timeout hint is applied depends on the database and dialect; verify the behavior in the SQL log. When locking multiple rows, always lock them in the same order (e.g. by id) to avoid deadlocks.

## 11. A job queue with SKIP LOCKED

When multiple instances pull work from the same table, PostgreSQL's `SKIP LOCKED` skips rows locked by another worker, so workers don't wait on each other and never pick up the same job twice:

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

For long-running jobs, the best approach is to mark the row as `RUNNING` like this and close the transaction, do the work outside the transaction, and write the result in a separate transaction.

## 12. Isolation levels

| Level | Dirty read | Non-repeatable read | Phantom read |
| --- | --- | --- | --- |
| `READ_UNCOMMITTED` | Possible | Possible | Possible |
| `READ_COMMITTED` | No | Possible | Possible |
| `REPEATABLE_READ` | No | No | Possible* |
| `SERIALIZABLE` | No | No | No |

\* PostgreSQL's `REPEATABLE_READ` implementation doesn't allow phantom reads either. The default is `READ_COMMITTED` on PostgreSQL and Oracle, and `REPEATABLE_READ` on MySQL InnoDB.

```java
@Transactional(isolation = Isolation.SERIALIZABLE)
public void transfer(...) { ... }
```

Higher isolation levels can cause serialization failures, which again require retrying the operation. For most applications `READ_COMMITTED` + `@Version` is the right balance.

## Conclusion

Remembering that `@Transactional` is a proxy explains most of the pitfalls: self-invocation, private methods and swallowed exceptions. Keep transactions short, move external calls and side effects to after the commit, and turn off `open-in-view`. For concurrency, the default choice should be optimistic locking with `@Version` and a retry that wraps the transaction; use pessimistic locks for frequently contended records and `SKIP LOCKED` for job queues.
