---
title: "Solving the N+1 Query Problem in Hibernate and Spring Data JPA"
description: "How to detect the N+1 query problem and fix it with JOIN FETCH, @EntityGraph, @BatchSize, SUBSELECT and DTO projections — a practical guide with examples."
date: 2026-11-21
tags: [java, hibernate, jpa, database, guide]
translation: /blog/hibernate-n-plus-one-problem
---

## Introduction

Most performance problems in JPA applications come from a single pattern: the **N+1 query problem**. With 10 rows in development nobody notices; in production a list of 1,000 rows sends 1,001 queries to the database and the page takes seconds to load.

This post shows the problem with a `Post`/`Comment` example, explains how to detect it, and which fix to choose in which situation.

## 1. What is N+1?

A simple model:

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

An innocent-looking service method:

```java
List<Post> posts = postRepository.findAll();
for (Post post : posts) {
    System.out.println(post.getTitle() + ": " + post.getComments().size());
}
```

The SQL log:

```sql
select p.id, p.title from post p;                       -- 1 query
select c.* from comment c where c.post_id = 1;          -- one per post
select c.* from comment c where c.post_id = 2;          -- and another
select c.* from comment c where c.post_id = 3;
-- ... N in total
```

One query loads the list (**1**), then accessing each post's lazy collection runs a separate query (**N**). The same happens on the `@ManyToOne` side: `comment.getPost().getTitle()` issues a separate `select` for every post not already in the persistence context.

## 2. Detecting the problem

The first step is to see the SQL that actually runs:

```properties
logging.level.org.hibernate.SQL=debug
logging.level.org.hibernate.orm.jdbc.bind=trace
spring.jpa.properties.hibernate.generate_statistics=true
```

With `generate_statistics` on, a summary like this is logged at the end of each session:

```text
StatisticalLoggingSessionEventListener : Session Metrics {
    1203400 nanoseconds spent preparing 101 JDBC statements;
    ...
}
```

101 statements for a single HTTP request is the clearest sign of N+1.

Even better, assert the query count in a test. Hibernate's `Statistics` API is enough for that:

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

This test catches the regression as soon as someone changes the repository method later.

## 3. Fix: JOIN FETCH

The most direct fix is to load the association in the same query:

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("select distinct p from Post p left join fetch p.comments")
    List<Post> findAllWithComments();
}
```

```sql
select p.*, c.* from post p left join comment c on c.post_id = p.id;
```

Since Hibernate 6 entity results are de-duplicated automatically, so `distinct` is no longer required, but there's no harm in writing it to state the intent.

## 4. Fix: @EntityGraph

To add a fetch plan to Spring Data derived methods without writing JPQL:

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"comments"})
    List<Post> findByTitleContaining(String keyword);

    @EntityGraph(attributePaths = {"comments", "author"})
    Optional<Post> findWithDetailsById(Long id);
}
```

`@EntityGraph` loads the associations with a join; they stay lazy on the entity and are only eager for this method. That's much safer than making them eager everywhere.

## 5. Fix: @BatchSize and default_batch_fetch_size

Sometimes you don't want a join (large collections, pagination). Batch fetching turns N queries into `N / batchSize` queries:

```java
@OneToMany(mappedBy = "post")
@BatchSize(size = 50)
private List<Comment> comments = new ArrayList<>();
```

Or globally for the whole application:

```properties
spring.jpa.properties.hibernate.default_batch_fetch_size=50
```

```sql
select p.* from post p;
select c.* from comment c where c.post_id in (1, 2, 3, ..., 50);
select c.* from comment c where c.post_id in (51, 52, ..., 100);
```

3 queries instead of 101 for 100 posts. `default_batch_fetch_size` is a low-risk setting worth enabling in almost every project.

## 6. Fix: @Fetch(FetchMode.SUBSELECT)

This Hibernate-specific option loads all collections at once, reusing the first query as a subquery:

```java
@OneToMany(mappedBy = "post")
@Fetch(FetchMode.SUBSELECT)
private List<Comment> comments = new ArrayList<>();
```

```sql
select c.* from comment c
where c.post_id in (select p.id from post p where ...);
```

2 queries in total. If the first query is expensive, remember it runs again as the subquery.

## 7. Fix: DTO and record projections

If a screen only shows a few fields, you don't need to load entities at all. Projections remove both the N+1 and the unnecessary column reads:

```java
public record PostSummary(Long id, String title, long commentCount) { }

@Query("""
       select new com.example.blog.PostSummary(p.id, p.title, count(c))
       from Post p left join p.comments c
       group by p.id, p.title
       """)
List<PostSummary> findSummaries();
```

Spring Data also supports interface and record projections:

```java
public interface PostTitle {
    Long getId();
    String getTitle();
}

List<PostTitle> findByTitleStartingWith(String prefix);   // interface projection

record PostView(Long id, String title) { }
List<PostView> findAllBy();                             // record (class-based) projection
```

Projections are not managed entities; they are read-only and don't add load to the persistence context. They should be the first choice for list screens and reports.

## 8. The pagination + collection fetch trap

When `JOIN FETCH` is combined with `Pageable`, Hibernate can't apply the LIMIT in SQL (the join multiplies the rows). Instead it **loads the whole result into memory and paginates there**, logging a warning:

```text
HHH90003004: firstResult/maxResults specified with collection fetch; applying in memory
```

Make sure this doesn't slip by silently by turning it into an error:

```properties
spring.jpa.properties.hibernate.query.fail_on_pagination_over_collection_fetch=true
```

The right fix is two queries: first paginate only the ids, then fetch the associations for those ids:

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

If you try to fetch two `List` collections in the same query:

```java
@Query("select p from Post p left join fetch p.comments left join fetch p.tags")
List<Post> findAllWithEverything();
// MultipleBagFetchException: cannot simultaneously fetch multiple bags
```

The Cartesian product of `List` (unordered, duplicate-allowing "bag") collections can't be split back correctly. Fixes:

- Turn one or both collections into a `Set`. The error goes away but the Cartesian product stays: 100 comments × 10 tags = 1,000 rows per post.
- Better: separate queries. Within the same transaction the second query fills the same `Post` instances in the persistence context:

```java
List<Post> posts = em.createQuery(
        "select p from Post p left join fetch p.comments where p.id in :ids", Post.class)
    .setParameter("ids", ids).getResultList();

em.createQuery(
        "select p from Post p left join fetch p.tags where p in :posts", Post.class)
    .setParameter("posts", posts).getResultList();
```

## 10. EAGER is not a fix

`fetch = FetchType.EAGER` looks like it solves the problem at first, but:

- The association is loaded on **every** query, even when it isn't needed.
- In JPQL queries, EAGER associations are often still loaded with separate queries; the N+1 doesn't go away, it just becomes invisible.
- It's hard to undo later, because the rest of the code assumes the association is always populated.

`@ManyToOne` and `@OneToOne` are EAGER by default. The rule is simple: **make every association LAZY** and fetch per query where you need it.

```java
@ManyToOne(fetch = FetchType.LAZY)
private Author author;
```

## 11. Open-in-view hides the problem

In Spring Boot, `spring.jpa.open-in-view` is `true` by default. It keeps the session open for the whole HTTP request, so accessing lazy associations in a controller or during JSON serialization doesn't fail — it **silently issues new queries**. Many N+1s don't happen in the service layer but while Jackson serializes an entity.

```properties
spring.jpa.open-in-view=false
```

Once it's off, lazy access outside a transaction throws `LazyInitializationException`. That's not a bug; it's a signal to state explicitly which data is loaded where.

## 12. Which technique when?

| Technique | Query count | When? | Watch out |
| --- | --- | --- | --- |
| `JOIN FETCH` | 1 | A single association, no pagination | In-memory paging with pagination |
| `@EntityGraph` | 1 | Spring Data derived methods | Same limits as `JOIN FETCH` |
| `@BatchSize` / `default_batch_fetch_size` | 1 + N/batch | General safety net, paged lists | Doesn't get down to one query |
| `FetchMode.SUBSELECT` | 2 | All collections always needed | First query runs again |
| DTO / record projection | 1 | Lists, reports, API responses | Not an entity, can't be updated |
| Two-step query | 2–3 | Pagination + collection | A bit more code |

## Conclusion

The N+1 problem isn't a Hibernate bug; it's the natural consequence of lazy loading. The approach that works well in practice: declare every association LAZY, add a safety net with `default_batch_fetch_size`, turn off `open-in-view`, load the data each screen needs explicitly with `JOIN FETCH`, `@EntityGraph` or projections, and verify query counts in tests for critical flows.
