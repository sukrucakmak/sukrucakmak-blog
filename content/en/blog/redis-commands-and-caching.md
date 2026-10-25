---
title: Redis Basics and Caching
description: "Data types with redis-cli (string, hash, list, set, sorted set), TTLs, the cache-aside pattern, Spring Boot and Node.js integration, persistence and monitoring commands."
date: 2026-11-03
tags: [redis, cache, database, guide]
translation: /blog/redis-commands-and-caching
---

## Introduction

Redis is an in-memory key-value database that answers in microseconds. Its most common use is caching, but it's also widely used for session storage, rate limiting, queues, leaderboards and pub/sub.

This post covers the basic `redis-cli` commands, the data types, and how to use Redis as a cache in an application.

## 1. Installing and connecting

```bash
# The quickest way, with Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Ubuntu / Debian
sudo apt install -y redis-server

# AlmaLinux / RHEL
sudo dnf install -y redis
sudo systemctl enable --now redis
```

```bash
redis-cli                          # local, 6379
redis-cli -h 10.0.1.20 -p 6379 -a 'password'
redis-cli -n 2                     # database number 2
redis-cli PING                     # PONG
docker exec -it redis redis-cli
```

## 2. Strings

The most basic type. Holds text, numbers, JSON or serialized objects (up to 512 MB).

```bash
SET user:42:name "Şükrü"
GET user:42:name
SET session:abc123 "{...}" EX 3600     # deleted after 1 hour
SET lock:order:7 1 NX EX 30            # create only if absent (simple lock)
MSET a 1 b 2
MGET a b
INCR page:views                         # atomic counter
INCRBY page:views 10
DEL user:42:name
EXISTS user:42:name
```

Building a hierarchy in key names with `:` (`object:id:field`) is a common convention; tools display that structure as a tree.

## 3. TTLs and expiry

```bash
EXPIRE session:abc123 600     # 600 seconds
TTL session:abc123            # remaining seconds; -1 no expiry, -2 missing
PEXPIRE key 1500              # milliseconds
PERSIST session:abc123        # remove the expiry
```

Every key used for caching should have a TTL; otherwise memory fills up over time.

## 4. Hashes

Keep an object's fields under a single key:

```bash
HSET user:42 name "Şükrü" email "sukru@example.com" plan "pro"
HGET user:42 email
HGETALL user:42
HINCRBY user:42 login_count 1
HDEL user:42 plan
HEXISTS user:42 email
```

## 5. Lists, Sets and Sorted Sets

```bash
# List: ordered, allows duplicates — queues, recent activity
LPUSH queue:emails "mail-1" "mail-2"
RPOP queue:emails
LRANGE recent:42 0 9            # first 10 elements
LTRIM recent:42 0 99            # keep only the last 100

# Set: unordered, unique — tags, unique visitors
SADD post:7:tags redis cache
SMEMBERS post:7:tags
SISMEMBER post:7:tags redis
SINTER user:1:follows user:2:follows   # followed by both

# Sorted Set: ordered by score — leaderboards
ZADD leaderboard 1500 "ali" 2300 "ayse" 1800 "mehmet"
ZREVRANGE leaderboard 0 2 WITHSCORES   # top 3
ZINCRBY leaderboard 100 "ali"
ZRANK leaderboard "ali"
```

| Type | When |
| --- | --- |
| String | Single value, JSON cache, counter, lock |
| Hash | Objects whose fields are read and written separately |
| List | Queue, last N records |
| Set | Unique membership, intersection/union |
| Sorted Set | Ranking, time-based index, rate-limit window |

## 6. Finding keys safely

```bash
SCAN 0 MATCH user:* COUNT 100     # cursor-based, doesn't block the server
redis-cli --scan --pattern 'cache:product:*'
redis-cli --scan --pattern 'cache:product:*' | xargs redis-cli DEL
TYPE user:42
DBSIZE
```

> Don't use `KEYS *` in production. It walks every key at once and blocks Redis for seconds on large databases. Use `SCAN` instead.

## 7. The cache-aside pattern

The most common caching strategy: check the cache first; on a miss, read from the database and write to the cache.

```javascript
// Node.js — node-redis v4+
import { createClient } from 'redis'

const redis = await createClient({ url: 'redis://localhost:6379' }).connect()

async function getProduct(id) {
  const key = `cache:product:${id}`
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)

  const product = await db.products.findById(id)
  await redis.set(key, JSON.stringify(product), { EX: 300 })
  return product
}

async function updateProduct(id, data) {
  await db.products.update(id, data)
  await redis.del(`cache:product:${id}`)     // invalidate the cache
}
```

The same pattern in Spring Boot with annotations:

```java
@Cacheable(value = "products", key = "#id")
public Product findById(Long id) { return repository.findById(id).orElseThrow(); }

@CacheEvict(value = "products", key = "#product.id")
public Product update(Product product) { return repository.save(product); }
```

```properties
spring.cache.type=redis
spring.data.redis.host=localhost
spring.cache.redis.time-to-live=5m
```

Don't forget to add `@EnableCaching` to a configuration class.

Things to keep in mind:

- **Delete the cache entry on update** rather than writing the new value; deleting is safer under race conditions.
- **Add a little randomness to TTLs** (e.g. 300 ± 30 s); thousands of keys expiring at the same moment put a sudden load on the database.
- Caching a short-lived empty value for missing records stops repeated database lookups for IDs that don't exist.

## 8. Memory limits and eviction

If you use Redis as a cache, set a memory limit and an eviction policy:

```bash
CONFIG SET maxmemory 512mb
CONFIG SET maxmemory-policy allkeys-lru
CONFIG GET maxmemory*
```

| Policy | Behavior |
| --- | --- |
| `noeviction` | Default; writes fail when memory is full |
| `allkeys-lru` | Evicts the least recently used key; recommended for a pure cache |
| `volatile-lru` | Evicts only among keys with a TTL |
| `allkeys-lfu` | Evicts the least frequently used key |

Put the same settings in `redis.conf` to make them permanent.

## 9. Persistence

| Method | Description |
| --- | --- |
| RDB | Periodic snapshots (`dump.rdb`); fast startup, recent writes may be lost |
| AOF | Appends every write to a log (`appendonly yes`); less data loss, larger files |
| None | For a pure cache; data is gone on restart |

```bash
CONFIG SET appendonly yes
BGSAVE                     # RDB snapshot in the background
LASTSAVE
```

## 10. Monitoring and troubleshooting

```bash
INFO                       # all statistics
INFO memory
INFO stats                 # keyspace_hits / keyspace_misses → hit ratio
redis-cli --stat           # per-second summary
redis-cli --bigkeys        # largest keys
redis-cli --latency
SLOWLOG GET 10             # slow commands
CLIENT LIST
MONITOR                    # show every command live (debug only!)
```

| Problem | Fix |
| --- | --- |
| `OOM command not allowed` | `maxmemory` is full and the policy is `noeviction`; change the policy or add memory |
| `NOAUTH Authentication required` | Pass the password with `-a` or run `AUTH password` |
| Connections refused | `bind 127.0.0.1` allows local only; remote access needs bind and firewall changes, always with a password |
| Redis freezes momentarily | Look for `KEYS`, large `DEL`s or commands in `SLOWLOG`; use `UNLINK` for big keys |
| Low hit ratio | TTLs too short or inconsistent key names |

> Never leave Redis without a password and open to the internet. It's the most common Redis security hole; set `requirepass` (or Redis 6+ ACLs) and open the port only to application servers.

## Conclusion

Redis's strength comes from using the right data type for the job: strings for single values, hashes for objects, sorted sets for rankings. When using it as a cache, three rules prevent most problems: give every key a TTL, delete the cache entry on update, and use `SCAN` instead of `KEYS` in production.
