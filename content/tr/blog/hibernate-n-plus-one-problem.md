---
title: "Hibernate ve Spring Data JPA'da N+1 Sorgu Problemi ve Çözümleri"
description: "N+1 sorgu problemini nasıl tespit edeceğinizi ve JOIN FETCH, @EntityGraph, @BatchSize, SUBSELECT ve DTO projection'larla nasıl çözeceğinizi örneklerle anlatan rehber."
date: 2026-11-21
tags: [java, hibernate, jpa, veritabanı, rehber]
translation: /en/blog/hibernate-n-plus-one-problem
---

## Giriş

JPA uygulamalarında performans sorunlarının büyük kısmı tek bir kalıptan çıkar: **N+1 sorgu problemi**. Geliştirme ortamında 10 kayıtla fark edilmez, production'da 1.000 kayıtlık bir listede veritabanına 1.001 sorgu gider ve sayfa saniyeler içinde açılmaz hale gelir.

Bu yazıda problemi bir `Post`/`Comment` örneği üzerinden gösterip, nasıl tespit edileceğini ve hangi durumda hangi çözümün seçilmesi gerektiğini anlatıyorum.

## 1. N+1 nedir?

Basit bir model:

```java
@Entity
public class Post {
    @Id @GeneratedValue
    private Long id;
    private String title;

    @OneToMany(mappedBy = "post")
    private List<Comment> comments = new ArrayList<>();
}

@Entity
public class Comment {
    @Id @GeneratedValue
    private Long id;
    private String text;

    @ManyToOne(fetch = FetchType.LAZY)
    private Post post;
}
```

Masum görünen bir servis metodu:

```java
List<Post> posts = postRepository.findAll();
for (Post post : posts) {
    System.out.println(post.getTitle() + ": " + post.getComments().size());
}
```

SQL log'u:

```sql
select p.id, p.title from post p;                       -- 1 sorgu
select c.* from comment c where c.post_id = 1;          -- her post için
select c.* from comment c where c.post_id = 2;          -- bir sorgu daha
select c.* from comment c where c.post_id = 3;
-- ... toplam N tane
```

Bir sorgu listeyi getirir (**1**), ardından her post'un lazy koleksiyonuna erişildiğinde ayrı bir sorgu çalışır (**N**). Aynı şey `@ManyToOne` tarafında da olur: `comment.getPost().getTitle()` çağrısı, persistence context'te olmayan her post için ayrı bir `select` üretir.

## 2. Problemi tespit etmek

İlk adım, çalışan SQL'i görmek:

```properties
logging.level.org.hibernate.SQL=debug
logging.level.org.hibernate.orm.jdbc.bind=trace
spring.jpa.properties.hibernate.generate_statistics=true
```

`generate_statistics` açıkken her session sonunda şuna benzer bir özet loglanır:

```text
StatisticalLoggingSessionEventListener : Session Metrics {
    1203400 nanoseconds spent preparing 101 JDBC statements;
    ...
}
```

Tek bir HTTP isteği için 101 statement, N+1'in en net işaretidir.

Daha iyisi, sorgu sayısını testte doğrulamak. Hibernate'in `Statistics` API'si bunun için yeterlidir:

```java
@SpringBootTest
@Transactional
class PostServiceTest {

    @Autowired EntityManagerFactory emf;
    @Autowired PostService postService;

    @Test
    void listingPostsUsesSingleQuery() {
        Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.clear();

        postService.findAllWithComments();

        assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
    }
}
```

Bu test, birisi ileride repository metodunu değiştirdiğinde regresyonu hemen yakalar.

## 3. Çözüm: JOIN FETCH

En doğrudan çözüm, ilişkiyi aynı sorguda getirmektir:

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("select distinct p from Post p left join fetch p.comments")
    List<Post> findAllWithComments();
}
```

```sql
select p.*, c.* from post p left join comment c on c.post_id = p.id;
```

Hibernate 6 ve sonrasında entity sonuçları otomatik olarak tekilleştirildiği için `distinct` artık zorunlu değil, ancak niyeti belirtmek için yazmakta sakınca yok.

## 4. Çözüm: @EntityGraph

JPQL yazmadan, Spring Data'nın türetilmiş metotlarına fetch planı eklemek için:

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"comments"})
    List<Post> findByTitleContaining(String keyword);

    @EntityGraph(attributePaths = {"comments", "author"})
    Optional<Post> findWithDetailsById(Long id);
}
```

`@EntityGraph` aynı sorguyu join'le getirir; ilişkiler entity üzerinde lazy kalır, sadece bu metot için eager davranır. Bu, "her yerde eager" yapmaktan çok daha güvenlidir.

## 5. Çözüm: @BatchSize ve default_batch_fetch_size

Bazen join istemezsiniz (ör. büyük koleksiyonlar, sayfalama). Batch fetching, N sorguyu `N / batchSize` sorguya indirir:

```java
@OneToMany(mappedBy = "post")
@BatchSize(size = 50)
private List<Comment> comments = new ArrayList<>();
```

Ya da tüm uygulama için global olarak:

```properties
spring.jpa.properties.hibernate.default_batch_fetch_size=50
```

```sql
select p.* from post p;
select c.* from comment c where c.post_id in (1, 2, 3, ..., 50);
select c.* from comment c where c.post_id in (51, 52, ..., 100);
```

100 post için 101 yerine 3 sorgu. `default_batch_fetch_size` neredeyse her projede açılmaya değer, düşük riskli bir ayardır.

## 6. Çözüm: @Fetch(FetchMode.SUBSELECT)

Hibernate'e özgü bu seçenek, ilk sorguyu alt sorgu olarak kullanarak tüm koleksiyonları tek seferde yükler:

```java
@OneToMany(mappedBy = "post")
@Fetch(FetchMode.SUBSELECT)
private List<Comment> comments = new ArrayList<>();
```

```sql
select c.* from comment c
where c.post_id in (select p.id from post p where ...);
```

Toplam 2 sorgu. İlk sorgu pahalıysa, alt sorgu olarak tekrar çalışacağını unutmayın.

## 7. Çözüm: DTO ve record projection'lar

Ekranda sadece birkaç alan gösteriyorsanız entity yüklemenize gerek yoktur. Projection'lar hem N+1'i hem de gereksiz kolon okumayı ortadan kaldırır:

```java
public record PostSummary(Long id, String title, long commentCount) { }

@Query("""
       select new com.example.blog.PostSummary(p.id, p.title, count(c))
       from Post p left join p.comments c
       group by p.id, p.title
       """)
List<PostSummary> findSummaries();
```

Spring Data, interface ve record projection'ları da destekler:

```java
public interface PostTitle {
    Long getId();
    String getTitle();
}

List<PostTitle> findByTitleStartingWith(String prefix);   // interface projection

record PostView(Long id, String title) { }
List<PostView> findAllBy();                             // record (class-based) projection
```

Projection'lar managed entity değildir; sadece okunur ve persistence context'e yük bindirmez. Listeleme ekranları ve raporlar için ilk tercih olmalıdır.

## 8. Sayfalama + koleksiyon fetch tuzağı

`JOIN FETCH` ile `Pageable` birlikte kullanıldığında Hibernate, LIMIT'i SQL'e uygulayamaz (join satır sayısını çoğaltır). Bunun yerine **tüm sonucu belleğe çeker ve sayfalamayı bellekte yapar**, log'a da bir uyarı yazar:

```text
HHH90003004: firstResult/maxResults specified with collection fetch; applying in memory
```

Bu uyarının sessizce geçmemesi için hata olarak ele alınmasını sağlayın:

```properties
spring.jpa.properties.hibernate.query.fail_on_pagination_over_collection_fetch=true
```

Doğru çözüm iki sorgu kullanmaktır: önce sadece id'leri sayfalayın, sonra o id'ler için ilişkileri getirin:

```java
@Query("select p.id from Post p order by p.createdAt desc")
Page<Long> findPageIds(Pageable pageable);

@Query("select p from Post p left join fetch p.comments where p.id in :ids order by p.createdAt desc")
List<Post> findAllWithCommentsByIdIn(List<Long> ids);
```

```java
Page<Long> ids = postRepository.findPageIds(PageRequest.of(0, 20));
List<Post> posts = postRepository.findAllWithCommentsByIdIn(ids.getContent());
return new PageImpl<>(posts, ids.getPageable(), ids.getTotalElements());
```

## 9. MultipleBagFetchException

İki `List` koleksiyonunu aynı sorguda fetch etmeye çalışırsanız:

```java
@Query("select p from Post p left join fetch p.comments left join fetch p.tags")
List<Post> findAllWithEverything();
// MultipleBagFetchException: cannot simultaneously fetch multiple bags
```

`List` (sırasız, tekrar eden "bag") koleksiyonların kartezyen çarpımı doğru ayrıştırılamaz. Çözümler:

- Koleksiyonlardan birini veya ikisini `Set` yapmak. Hata kaybolur ama kartezyen çarpım kalır: 100 yorum × 10 etiket = post başına 1.000 satır.
- Daha iyisi: ayrı sorgular. Aynı transaction içinde ikinci sorgu, persistence context'teki aynı `Post` nesnelerini doldurur:

```java
List<Post> posts = em.createQuery(
        "select p from Post p left join fetch p.comments where p.id in :ids", Post.class)
    .setParameter("ids", ids).getResultList();

em.createQuery(
        "select p from Post p left join fetch p.tags where p in :posts", Post.class)
    .setParameter("posts", posts).getResultList();
```

## 10. EAGER bir çözüm değildir

`fetch = FetchType.EAGER` ilk bakışta problemi çözüyor gibi görünür ama:

- İlişki **her** sorguda yüklenir, ihtiyaç olmasa bile.
- JPQL sorgularında EAGER ilişkiler çoğu zaman yine ayrı sorgularla yüklenir; yani N+1 kaybolmaz, sadece görünmez olur.
- Sonradan geri almak zordur, çünkü kodun geri kalanı ilişkinin hep dolu olduğunu varsayar.

`@ManyToOne` ve `@OneToOne` varsayılan olarak EAGER'dır. Kural basit: **tüm ilişkileri LAZY yapın**, ihtiyaç olan yerde sorgu bazında fetch edin.

```java
@ManyToOne(fetch = FetchType.LAZY)
private Author author;
```

## 11. Open-in-view problemi gizler

Spring Boot'ta `spring.jpa.open-in-view` varsayılan olarak `true`'dur. Bu, session'ı HTTP isteği boyunca açık tutar; böylece controller'da veya JSON serileştirme sırasında lazy ilişkilere erişmek hata vermez, **sessizce yeni sorgu üretir**. N+1'lerin çoğu servis katmanında değil, Jackson bir entity'yi serileştirirken ortaya çıkar.

```properties
spring.jpa.open-in-view=false
```

Kapatınca transaction dışında lazy erişim `LazyInitializationException` fırlatır. Bu bir hata değil, hangi verinin nerede yüklenmesi gerektiğini açıkça belirtmeniz için bir sinyaldir.

## 12. Hangi teknik ne zaman?

| Teknik | Sorgu sayısı | Ne zaman? | Dikkat |
| --- | --- | --- | --- |
| `JOIN FETCH` | 1 | Tek bir ilişki, sayfalama yok | Sayfalama ile bellek içi paging |
| `@EntityGraph` | 1 | Spring Data türetilmiş metotlar | `JOIN FETCH` ile aynı kısıtlar |
| `@BatchSize` / `default_batch_fetch_size` | 1 + N/batch | Genel güvenlik ağı, sayfalı listeler | Tek sorguya inmez |
| `FetchMode.SUBSELECT` | 2 | Tüm koleksiyonlar hep lazım | İlk sorgu tekrar çalışır |
| DTO / record projection | 1 | Listeler, raporlar, API yanıtları | Entity değil, güncellenemez |
| İki aşamalı sorgu | 2–3 | Sayfalama + koleksiyon | Biraz daha fazla kod |

## Sonuç

N+1 problemi Hibernate'in bir hatası değil, lazy loading'in doğal sonucudur. Pratikte iyi çalışan yaklaşım şu: tüm ilişkileri LAZY tanımlayın, `default_batch_fetch_size` ile bir güvenlik ağı kurun, `open-in-view`'ı kapatın, her ekran için ihtiyacı olan veriyi `JOIN FETCH`, `@EntityGraph` veya projection'larla açıkça getirin ve kritik akışlarda sorgu sayısını testlerle doğrulayın.
