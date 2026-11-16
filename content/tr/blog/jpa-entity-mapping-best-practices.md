---
title: "JPA ve Hibernate Entity Mapping için En İyi Pratikler"
description: "Hibernate 7 ve Spring Boot ile entity tasarlarken dikkat edilmesi gerekenler — ID stratejileri ve batching, LAZY ilişkiler, çift yönlü mapping, equals/hashCode, @Version, auditing ve şema yönetimi."
date: 2026-11-20
tags: [java, hibernate, jpa, veritabanı, rehber]
translation: /en/blog/jpa-entity-mapping-best-practices
---

## Giriş

JPA ile bir entity yazmak kolaydır; performanslı ve öngörülebilir davranan bir entity yazmak ise birkaç kurala dikkat etmeyi gerektirir. Yanlış seçilmiş bir ID stratejisi batch insert'leri devre dışı bırakır, varsayılan `EAGER` ilişkiler gereksiz join'ler üretir, hatalı `equals`/`hashCode` ise `Set` içindeki entity'lerin kaybolmasına yol açar.

Bu yazıda Hibernate 7 ve Spring Boot ile entity mapping yaparken uyguladığım pratikleri bir örnek üzerinden topluyorum: `Post`, `Comment` ve `Tag`.

## 1. ID stratejisi: SEQUENCE ve batching

`GenerationType.IDENTITY`, ID'yi veritabanının auto-increment kolonu üretir. Hibernate yeni kaydın ID'sini öğrenmek için her `persist` işleminde INSERT'i hemen çalıştırmak zorundadır; bu da **JDBC batch insert'i devre dışı bırakır**.

PostgreSQL ve Oracle gibi sequence destekleyen veritabanlarında `SEQUENCE` tercih edin:

```java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "post_seq")
@SequenceGenerator(name = "post_seq", sequenceName = "post_seq", allocationSize = 50)
private Long id;
```

`allocationSize = 50` ile Hibernate sequence'tan bir kez değer alıp sonraki 50 ID'yi bellekte üretir. Sequence'ın `INCREMENT BY` değeri de 50 olmalıdır:

```sql
create sequence post_seq start with 1 increment by 50;
```

Batching'i açmak için:

```properties
spring.jpa.properties.hibernate.jdbc.batch_size=50
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
```

`order_inserts` ve `order_updates`, aynı tabloya giden ifadeleri gruplayarak batch'lerin bölünmesini engeller. MySQL'de sequence yoksa `IDENTITY` kullanmak zorunda kalabilirsiniz; bu durumda toplu yazmalar için `JdbcClient` gibi alternatifleri değerlendirin.

## 2. İlişkilerde FetchType.LAZY

JPA spesifikasyonunda `@ManyToOne` ve `@OneToOne` varsayılan olarak **EAGER**'dır. Bir `Comment` yüklediğinizde, ihtiyacınız olsun olmasın `Post` da yüklenir. Kural basit: tüm ilişkileri LAZY yapın, ihtiyaç duyduğunuz yerde sorguda fetch edin.

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "post_id")
private Post post;
```

`@OneToMany` ve `@ManyToMany` zaten varsayılan olarak LAZY'dir. Fetch kararını entity'de değil, sorguda (`join fetch`, `@EntityGraph`) verin.

## 3. Çift yönlü @OneToMany

İlişkinin sahibi (owning side) foreign key'i tutan taraftır, yani `Comment`. `Post` tarafında `mappedBy` kullanın ve iki tarafı senkron tutan yardımcı metotlar yazın:

```java
@OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Comment> comments = new ArrayList<>();

public void addComment(Comment comment) {
    comments.add(comment);
    comment.setPost(this);
}

public void removeComment(Comment comment) {
    comments.remove(comment);
    comment.setPost(null);
}
```

- **`cascade`** sadece parent → child yönünde mantıklıdır. `Comment` üzerinde `@ManyToOne(cascade = ...)` kullanmayın; bir yorumu silmek gönderiyi silmemelidir.
- **`orphanRemoval = true`**, koleksiyondan çıkarılan child'ın veritabanından da silinmesini sağlar.
- `@ManyToMany` ilişkilerinde `CascadeType.REMOVE` kullanmayın; paylaşılan `Tag` kayıtları silinir.

## 4. List mi, Set mi?

Hibernate sırasız `List` koleksiyonlarını **bag** olarak ele alır. Aynı sorguda iki bag'i `join fetch` ile yüklemeye çalışırsanız `MultipleBagFetchException` alırsınız. Ayrıca `@ManyToMany` bir `List`'ten tek eleman silmek, join tablosundaki tüm satırları silip yeniden eklemeye yol açabilir.

Pratik öneri:

- `@OneToMany` için `List` genelde yeterlidir; birden fazla koleksiyonu aynı anda fetch etmeniz gerekiyorsa ayrı sorgular kullanın.
- `@ManyToMany` için `Set` tercih edin.
- `Set` kullanıyorsanız `equals`/`hashCode` doğru tanımlanmış olmalıdır.

## 5. equals ve hashCode

Entity'lerde `equals`/`hashCode` iki zorluk taşır: ID kaydedilene kadar `null`'dır ve Hibernate proxy'leri gerçek sınıfın alt sınıfıdır. ID tabanlı güvenli bir yaklaşım:

```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Comment other)) return false;
    return id != null && id.equals(other.getId());
}

@Override
public int hashCode() {
    return getClass().hashCode();
}
```

`hashCode` sabit olduğu için entity kaydedilip ID aldıktan sonra da `Set` içindeki konumu değişmez. Getter (`other.getId()`) kullanmak proxy'lerde doğru değeri almanızı sağlar.

Doğal bir benzersiz anahtar varsa (`slug`, `isbn`, `email`) `@NaturalId` ile işaretleyip `equals`/`hashCode`'u ona dayandırabilirsiniz:

```java
@NaturalId
@Column(nullable = false, unique = true)
private String slug;
```

## 6. Record ve Lombok @Data entity olmaz

- **Record'lar** `final`'dır ve alanları değiştirilemez; Hibernate'in proxy üretmesi ve dirty checking için uygun değildir. Ancak DTO ve projection olarak mükemmeldir. Hibernate 6.2+ ile `@Embeddable` olarak da record kullanabilirsiniz.
- **Lombok `@Data`**, tüm alanları kullanan `equals`/`hashCode`/`toString` üretir. Lazy ilişkiler `toString` içinde tetiklenir, çift yönlü ilişkilerde sonsuz döngü ve `StackOverflowError` oluşur. `@Getter`/`@Setter` yeterlidir.

```java
public record PostSummary(Long id, String title, long commentCount) { }

@Embeddable
public record Address(String city, String street, String zipCode) { }
```

## 7. Enum, @Version ve auditing

```java
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)
private PostStatus status;

@Version
private long version;

@CreationTimestamp
private Instant createdAt;

@UpdateTimestamp
private Instant updatedAt;
```

- **`EnumType.STRING`**: Varsayılan `ORDINAL`, enum sırası değişince verinizi sessizce bozar.
- **`@Version`**: Optimistic locking sağlar. İki kullanıcı aynı kaydı güncellemeye çalışırsa ikincisi `OptimisticLockException` alır; kayıp güncelleme (lost update) olmaz.
- **Auditing**: Hibernate'in `@CreationTimestamp`/`@UpdateTimestamp` anotasyonları en basit yoldur. Kimin değiştirdiğini de tutmak istiyorsanız Spring Data'nın `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy` anotasyonlarını `@EntityListeners(AuditingEntityListener.class)` ve `@EnableJpaAuditing` ile kullanın.

## 8. Tam örnek

```java
@Entity
@Table(name = "post")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "post_seq")
    @SequenceGenerator(name = "post_seq", sequenceName = "post_seq", allocationSize = 50)
    private Long id;

    @NaturalId
    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostStatus status = PostStatus.DRAFT;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "post_tag",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    @Version
    private long version;

    @CreationTimestamp
    private Instant createdAt;

    protected Post() { }   // JPA için

    public Post(String slug, String title) {
        this.slug = slug;
        this.title = title;
    }

    public void addComment(Comment c) { comments.add(c); c.setPost(this); }
    public void removeComment(Comment c) { comments.remove(c); c.setPost(null); }
    public void addTag(Tag tag) { tags.add(tag); }

    @Override
    public boolean equals(Object o) {
        return this == o || (o instanceof Post other && Objects.equals(slug, other.getSlug()));
    }

    @Override
    public int hashCode() { return Objects.hash(slug); }

    // getter'lar ...
}

@Entity
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "comment_seq")
    @SequenceGenerator(name = "comment_seq", sequenceName = "comment_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(nullable = false, length = 2000)
    private String body;

    // equals/hashCode: 5. bölümdeki ID tabanlı yaklaşım
}

@Entity
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "tag_seq")
    @SequenceGenerator(name = "tag_seq", sequenceName = "tag_seq", allocationSize = 50)
    private Long id;

    @NaturalId
    @Column(nullable = false, unique = true)
    private String name;
}
```

`Tag` tarafında `@ManyToMany(mappedBy = "tags")` koleksiyonu tanımlamadım; bir etiketin tüm gönderilerine ihtiyaç varsa bunu sorgu ile almak, binlerce elemanlı bir koleksiyonu entity'de taşımaktan daha güvenlidir.

## 9. Spring Boot ayarları

```properties
# View render edilirken lazy yükleme yapılmasını engeller
spring.jpa.open-in-view=false

# Şemayı Hibernate değil migration aracı yönetir
spring.jpa.hibernate.ddl-auto=validate

# SQL ve parametre loglama (sadece geliştirme ortamında)
logging.level.org.hibernate.SQL=debug
logging.level.org.hibernate.orm.jdbc.bind=trace
```

- **`open-in-view=false`**: Spring Boot varsayılan olarak açık bırakır ve başlangıçta uyarı loglar. Açıkken transaction dışında, controller veya view katmanında fark edilmeyen sorgular çalışır. Kapattığınızda `LazyInitializationException` alırsanız bu, sorguda fetch etmeniz gereken bir ilişkiyi gösterir.
- **`ddl-auto=validate`**: Production'da `update` kullanmayın. Şemayı Flyway veya Liquibase ile versiyonlayın; Hibernate sadece entity'lerin şemayla uyumlu olduğunu doğrulasın.

```text
src/main/resources/db/migration/
  V1__create_post.sql
  V2__create_comment_and_tag.sql
```

## 10. Özet tablo

| Konu | Öneri |
| --- | --- |
| ID | `SEQUENCE` + `allocationSize`, `IDENTITY` batching'i kapatır |
| `@ManyToOne` / `@OneToOne` | Her zaman `FetchType.LAZY` |
| Çift yönlü ilişki | `mappedBy` + `addX`/`removeX` yardımcı metotları |
| Cascade | Sadece parent → child |
| `@ManyToMany` | `Set`, `CascadeType.REMOVE` yok |
| equals/hashCode | ID + sabit `hashCode` ya da `@NaturalId` |
| Enum | `EnumType.STRING` |
| Eşzamanlılık | `@Version` |
| Şema | `ddl-auto=validate` + Flyway/Liquibase |
| OSIV | `spring.jpa.open-in-view=false` |

## Sonuç

İyi tasarlanmış bir entity, performans sorunlarının çoğunu daha ortaya çıkmadan engeller. SEQUENCE ile batching'i açık tutun, tüm ilişkileri LAZY yapıp fetch kararını sorguya bırakın, çift yönlü ilişkileri yardımcı metotlarla senkron tutun ve `equals`/`hashCode`'u bilinçli tanımlayın. Geliştirme sırasında SQL loglarını açık tutmak, Hibernate'in arka planda ne yaptığını görmenin en kolay yoludur.
