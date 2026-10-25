---
title: Redis Temel Komutları ve Cache Kullanımı
description: "redis-cli ile veri tipleri (string, hash, list, set, sorted set), TTL, cache-aside deseni, Spring Boot ve Node.js entegrasyonu, kalıcılık ve izleme komutları."
date: 2026-11-03
tags: [redis, cache, veritabanı, rehber]
translation: /en/blog/redis-commands-and-caching
---

## Giriş

Redis, verileri bellekte tutan, mikrosaniyeler mertebesinde yanıt veren bir anahtar-değer veritabanıdır. En yaygın kullanım alanı cache'tir; ama session saklama, rate limiting, kuyruk, sıralama tabloları (leaderboard) ve pub/sub için de sıkça kullanılır.

Bu yazıda `redis-cli` ile temel komutları, veri tiplerini ve uygulamada cache olarak nasıl kullanılacağını ele alacağız.

## 1. Kurulum ve bağlanma

```bash
# Docker ile en hızlı yol
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Ubuntu / Debian
sudo apt install -y redis-server

# AlmaLinux / RHEL
sudo dnf install -y redis
sudo systemctl enable --now redis
```

```bash
redis-cli                          # lokal, 6379
redis-cli -h 10.0.1.20 -p 6379 -a 'şifre'
redis-cli -n 2                     # 2 numaralı veritabanı
redis-cli PING                     # PONG
docker exec -it redis redis-cli
```

## 2. String

En temel tip. Metin, sayı, JSON ya da serileştirilmiş nesne tutabilir (en fazla 512 MB).

```bash
SET user:42:name "Şükrü"
GET user:42:name
SET session:abc123 "{...}" EX 3600     # 1 saat sonra silinir
SET lock:order:7 1 NX EX 30            # yoksa oluştur (basit kilit)
MSET a 1 b 2
MGET a b
INCR page:views                         # atomik sayaç
INCRBY page:views 10
DEL user:42:name
EXISTS user:42:name
```

Anahtar adlarında `:` ile hiyerarşi kurmak (`nesne:id:alan`) yaygın bir gelenektir; araçlar da bu yapıyı ağaç olarak gösterir.

## 3. TTL ve süre yönetimi

```bash
EXPIRE session:abc123 600     # 600 saniye
TTL session:abc123            # kalan süre (saniye); -1 süresiz, -2 yok
PEXPIRE key 1500              # milisaniye
PERSIST session:abc123        # süreyi kaldır
```

Cache için kullanılan her anahtarın bir TTL'i olmalıdır; aksi halde bellek zamanla dolar.

## 4. Hash

Bir nesnenin alanlarını tek anahtar altında tutar:

```bash
HSET user:42 name "Şükrü" email "sukru@example.com" plan "pro"
HGET user:42 email
HGETALL user:42
HINCRBY user:42 login_count 1
HDEL user:42 plan
HEXISTS user:42 email
```

## 5. List, Set ve Sorted Set

```bash
# List: sıralı, tekrar edebilir — kuyruk, son aktiviteler
LPUSH queue:emails "mail-1" "mail-2"
RPOP queue:emails
LRANGE recent:42 0 9            # ilk 10 eleman
LTRIM recent:42 0 99            # sadece son 100'ü tut

# Set: sırasız, tekil — etiketler, benzersiz ziyaretçiler
SADD post:7:tags redis cache
SMEMBERS post:7:tags
SISMEMBER post:7:tags redis
SINTER user:1:follows user:2:follows   # ortak takip edilenler

# Sorted Set: skora göre sıralı — leaderboard
ZADD leaderboard 1500 "ali" 2300 "ayşe" 1800 "mehmet"
ZREVRANGE leaderboard 0 2 WITHSCORES   # ilk 3
ZINCRBY leaderboard 100 "ali"
ZRANK leaderboard "ali"
```

| Tip | Ne zaman |
| --- | --- |
| String | Tek değer, JSON cache, sayaç, kilit |
| Hash | Alanları ayrı ayrı okunup yazılan nesneler |
| List | Kuyruk, son N kayıt |
| Set | Tekil üyelik, kesişim/birleşim |
| Sorted Set | Sıralama, zaman bazlı indeks, rate limit penceresi |

## 6. Anahtarları güvenle bulmak

```bash
SCAN 0 MATCH user:* COUNT 100     # imleçle, sunucuyu bloklamadan
redis-cli --scan --pattern 'cache:product:*'
redis-cli --scan --pattern 'cache:product:*' | xargs redis-cli DEL
TYPE user:42
DBSIZE
```

> Production'da `KEYS *` kullanmayın. Tüm anahtarları tek seferde taradığı için büyük veritabanlarında Redis'i saniyelerce bloklar. Yerine `SCAN` kullanın.

## 7. Cache-aside deseni

En yaygın cache stratejisi: önce cache'e bak, yoksa veritabanından oku ve cache'e yaz.

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
  await redis.del(`cache:product:${id}`)     // cache'i geçersiz kıl
}
```

Spring Boot'ta aynı desen anotasyonlarla:

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

`@EnableCaching` anotasyonunu bir configuration sınıfına eklemeyi unutmayın.

Dikkat edilmesi gerekenler:

- **Güncellemede cache'i silin**, yeni değeri yazmaya çalışmayın; yarış durumlarında silmek daha güvenlidir.
- **TTL'e küçük bir rastgelelik ekleyin** (ör. 300 ± 30 sn); aynı anda süresi dolan binlerce anahtar veritabanına ani yük bindirir.
- Cache'te olmayan kayıtlar için de kısa TTL'li boş bir değer yazmak, var olmayan ID'lerle veritabanının sürekli sorgulanmasını engeller.

## 8. Bellek sınırı ve eviction

Redis'i cache olarak kullanıyorsanız bellek sınırı ve çıkarma politikası belirleyin:

```bash
CONFIG SET maxmemory 512mb
CONFIG SET maxmemory-policy allkeys-lru
CONFIG GET maxmemory*
```

| Politika | Davranış |
| --- | --- |
| `noeviction` | Varsayılan; bellek dolunca yazmalar hata verir |
| `allkeys-lru` | En az kullanılan anahtarı siler; saf cache için önerilir |
| `volatile-lru` | Sadece TTL'i olan anahtarlar arasından siler |
| `allkeys-lfu` | En az sıklıkla kullanılanı siler |

Kalıcı olması için aynı ayarları `redis.conf` içine yazın.

## 9. Kalıcılık

| Yöntem | Açıklama |
| --- | --- |
| RDB | Belirli aralıklarla anlık görüntü (`dump.rdb`); hızlı açılış, son değişiklikler kaybolabilir |
| AOF | Her yazma işlemini log'a ekler (`appendonly yes`); daha az veri kaybı, daha büyük dosya |
| Hiçbiri | Saf cache için; yeniden başlatmada veri gider |

```bash
CONFIG SET appendonly yes
BGSAVE                     # arka planda RDB anlık görüntüsü
LASTSAVE
```

## 10. İzleme ve sorun giderme

```bash
INFO                       # tüm istatistikler
INFO memory
INFO stats                 # keyspace_hits / keyspace_misses → hit oranı
redis-cli --stat           # saniyelik özet
redis-cli --bigkeys        # en büyük anahtarlar
redis-cli --latency
SLOWLOG GET 10             # yavaş komutlar
CLIENT LIST
MONITOR                    # tüm komutları canlı göster (sadece debug!)
```

| Sorun | Çözüm |
| --- | --- |
| `OOM command not allowed` | `maxmemory` doldu ve politika `noeviction`; politikayı değiştirin ya da belleği artırın |
| `NOAUTH Authentication required` | `-a` ile şifre verin ya da `AUTH şifre` |
| Bağlantı reddediliyor | `bind 127.0.0.1` sadece lokale açık; uzak erişim için bind ve firewall ayarı, mutlaka şifreyle |
| Redis anlık donuyor | `KEYS`, büyük `DEL` ya da `SLOWLOG`'daki komutlara bakın; büyük anahtarlar için `UNLINK` kullanın |
| Hit oranı düşük | TTL çok kısa ya da anahtar adları tutarsız |

> Redis'i şifresiz ve internete açık bırakmayın. Bu, en sık rastlanan Redis güvenlik açığıdır; `requirepass` (ya da Redis 6+ ACL) ayarlayın ve portu sadece uygulama sunucularına açın.

## Sonuç

Redis'in gücü, doğru veri tipini doğru işte kullanmaktan gelir: tek değer için string, nesne için hash, sıralama için sorted set. Cache olarak kullanırken üç kural çoğu sorunu baştan çözer: her anahtara TTL verin, güncellemede cache'i silin ve production'da `KEYS` yerine `SCAN` kullanın.
