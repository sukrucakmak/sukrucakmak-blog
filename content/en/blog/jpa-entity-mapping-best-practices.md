---
title: "JPA and Hibernate Entity Mapping Best Practices"
description: "What to watch for when designing entities with Hibernate 7 and Spring Boot — ID strategies and batching, LAZY associations, bidirectional mappings, equals/hashCode, @Version, auditing and schema management."
date: 2026-11-20
tags: [java, hibernate, jpa, database, guide]
translation: /blog/jpa-entity-mapping-best-practices
---

## Introduction

Writing an entity with JPA is easy; writing one that performs well and behaves predictably takes a few rules. A poorly chosen ID strategy disables batch inserts, default `EAGER` associations produce unnecessary joins, and a wrong `equals`/`hashCode` makes entities vanish from a `Set`.

This post collects the practices I follow when mapping entities with Hibernate 7 and Spring Boot, using an example: `Post`, `Comment` and `Tag`.

## 1. ID strategy: SEQUENCE and batching

With `GenerationType.IDENTITY`, the database's auto-increment column generates the ID. To learn the new row's ID, Hibernate has to execute the INSERT immediately on every `persist`, which **disables JDBC batch inserts**.

On databases that support sequences, such as PostgreSQL and Oracle, prefer `SEQUENCE`:

```java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "post_seq")
@SequenceGenerator(name = "post_seq", sequenceName = "post_seq", allocationSize = 50)
private Long id;
```

With `allocationSize = 50`, Hibernate fetches one value from the sequence and generates the next 50 IDs in memory. The sequence's `INCREMENT BY` must also be 50:

```sql
create sequence post_seq start with 1 increment by 50;
```

To enable batching:

```properties
spring.jpa.properties.hibernate.jdbc.batch_size=50
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
```

`order_inserts` and `order_updates` group statements targeting the same table so batches aren't split. On MySQL, without sequences, you may have to use `IDENTITY`; in that case consider alternatives like `JdbcClient` for bulk writes.

## 2. FetchType.LAZY on associations

In the JPA specification, `@ManyToOne` and `@OneToOne` are **EAGER** by default. When you load a `Comment`, its `Post` is loaded too, whether you need it or not. The rule is simple: make every association LAZY and fetch it in the query where you need it.

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "post_id")
private Post post;
```

`@OneToMany` and `@ManyToMany` are already LAZY by default. Make the fetch decision in the query (`join fetch`, `@EntityGraph`), not in the entity.

## 3. Bidirectional @OneToMany

The owning side of the association is the one holding the foreign key, i.e. `Comment`. On the `Post` side, use `mappedBy` and write helper methods that keep both sides in sync:

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

- **`cascade`** only makes sense from parent → child. Don't use `@ManyToOne(cascade = ...)` on `Comment`; deleting a comment must not delete the post.
- **`orphanRemoval = true`** deletes a child from the database when it is removed from the collection.
- Don't use `CascadeType.REMOVE` on `@ManyToMany`; shared `Tag` rows would be deleted.

## 4. List or Set?

Hibernate treats unordered `List` collections as **bags**. If you try to `join fetch` two bags in the same query, you get a `MultipleBagFetchException`. Also, removing a single element from a `@ManyToMany` `List` can cause all rows of the join table to be deleted and re-inserted.

Practical advice:

- A `List` is usually fine for `@OneToMany`; if you need to fetch several collections at once, use separate queries.
- Prefer `Set` for `@ManyToMany`.
- If you use a `Set`, `equals`/`hashCode` must be defined correctly.

## 5. equals and hashCode

`equals`/`hashCode` on entities has two challenges: the ID is `null` until the entity is saved, and Hibernate proxies are subclasses of the real class. A safe ID-based approach:

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

Because `hashCode` is constant, the entity's position in a `Set` doesn't change after it is saved and gets an ID. Using the getter (`other.getId()`) ensures you get the right value from proxies.

If there is a natural unique key (`slug`, `isbn`, `email`), you can mark it with `@NaturalId` and base `equals`/`hashCode` on it:

```java
@NaturalId
@Column(nullable = false, unique = true)
private String slug;
```

## 6. Records and Lombok @Data are not entities

- **Records** are `final` and their fields are immutable; they don't work with Hibernate's proxies and dirty checking. They are, however, perfect as DTOs and projections. Since Hibernate 6.2 you can also use a record as an `@Embeddable`.
- **Lombok `@Data`** generates `equals`/`hashCode`/`toString` over all fields. Lazy associations get triggered in `toString`, and bidirectional associations cause infinite loops and a `StackOverflowError`. `@Getter`/`@Setter` is enough.

```java
public record PostSummary(Long id, String title, long commentCount) { }

@Embeddable
public record Address(String city, String street, String zipCode) { }
```

## 7. Enums, @Version and auditing

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

- **`EnumType.STRING`**: The default `ORDINAL` silently corrupts your data when the enum order changes.
- **`@Version`**: Provides optimistic locking. If two users try to update the same row, the second one gets an `OptimisticLockException` instead of a lost update.
- **Auditing**: Hibernate's `@CreationTimestamp`/`@UpdateTimestamp` are the simplest option. If you also want to record who made the change, use Spring Data's `@CreatedDate`, `@LastModifiedDate` and `@CreatedBy` together with `@EntityListeners(AuditingEntityListener.class)` and `@EnableJpaAuditing`.

## 8. Full example

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

    protected Post() { }   // for JPA

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

    // getters ...
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

    // equals/hashCode: the ID-based approach from section 5
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

I didn't define a `@ManyToMany(mappedBy = "tags")` collection on `Tag`; if you need all posts for a tag, fetching them with a query is safer than carrying a collection with thousands of elements in the entity.

## 9. Spring Boot settings

```properties
# Prevents lazy loading while the view is rendered
spring.jpa.open-in-view=false

# The schema is managed by a migration tool, not Hibernate
spring.jpa.hibernate.ddl-auto=validate

# SQL and parameter logging (development only)
logging.level.org.hibernate.SQL=debug
logging.level.org.hibernate.orm.jdbc.bind=trace
```

- **`open-in-view=false`**: Spring Boot leaves it enabled by default and logs a warning at startup. While it is on, unnoticed queries run outside the transaction, in the controller or view layer. If you get a `LazyInitializationException` after turning it off, it points to an association you should fetch in the query.
- **`ddl-auto=validate`**: Don't use `update` in production. Version your schema with Flyway or Liquibase; let Hibernate only validate that the entities match the schema.

```text
src/main/resources/db/migration/
  V1__create_post.sql
  V2__create_comment_and_tag.sql
```

## 10. Summary table

| Topic | Recommendation |
| --- | --- |
| ID | `SEQUENCE` + `allocationSize`; `IDENTITY` disables batching |
| `@ManyToOne` / `@OneToOne` | Always `FetchType.LAZY` |
| Bidirectional association | `mappedBy` + `addX`/`removeX` helper methods |
| Cascade | Parent → child only |
| `@ManyToMany` | `Set`, no `CascadeType.REMOVE` |
| equals/hashCode | ID + constant `hashCode`, or `@NaturalId` |
| Enum | `EnumType.STRING` |
| Concurrency | `@Version` |
| Schema | `ddl-auto=validate` + Flyway/Liquibase |
| OSIV | `spring.jpa.open-in-view=false` |

## Conclusion

A well-designed entity prevents most performance problems before they show up. Keep batching enabled with SEQUENCE, make every association LAZY and leave the fetch decision to the query, keep bidirectional associations in sync with helper methods, and define `equals`/`hashCode` deliberately. Keeping SQL logging on during development is the easiest way to see what Hibernate does behind the scenes.
