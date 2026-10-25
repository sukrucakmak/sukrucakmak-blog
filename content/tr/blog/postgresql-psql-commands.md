---
title: PostgreSQL ve psql Temel Komutları
description: "psql ile bağlanma, meta komutlar (\\l, \\dt, \\d), kullanıcı ve yetki yönetimi, yedekleme/geri yükleme, sorgu analizi ve günlük bakım komutları."
date: 2026-11-02
tags: [postgresql, veritabanı, rehber]
translation: /en/blog/postgresql-psql-commands
---

## Giriş

PostgreSQL, açık kaynak dünyasının en çok tercih edilen ilişkisel veritabanlarından biri. `psql` ise onun komut satırı istemcisi: GUI araçlarına göre daha hızlıdır, sunucuda her zaman hazırdır ve script'lerde kullanılabilir.

Bu yazı, `psql` ile günlük işte en çok kullanılan komutları ve SQL kalıplarını bir arada topluyor.

## 1. Bağlanma

```bash
psql -U app -d appdb                         # lokal
psql -h db.example.com -p 5432 -U app -d appdb
psql "postgresql://app:secret@localhost:5432/appdb"
sudo -u postgres psql                        # süper kullanıcı olarak (Linux)
docker compose exec db psql -U app -d appdb  # container içinde
```

Şifreyi her seferinde yazmamak için `~/.pgpass` dosyası (izni `600` olmalı):

```bash
# host:port:database:user:password
localhost:5432:appdb:app:secret
```

## 2. psql meta komutları

Ters bölü ile başlayan komutlar SQL değil, psql'in kendi komutlarıdır ve noktalı virgül gerektirmez.

| Komut | Açıklama |
| --- | --- |
| `\l` | Veritabanlarını listele |
| `\c appdb` | Başka veritabanına geç |
| `\dn` | Şemalar |
| `\dt` | Tablolar (`\dt *.*` tüm şemalar) |
| `\d users` | Tablonun kolonları, index'leri, constraint'leri |
| `\d+ users` | Ek olarak boyut ve açıklamalar |
| `\di` | Index'ler |
| `\dv` | View'lar |
| `\df` | Fonksiyonlar |
| `\du` | Kullanıcılar/roller |
| `\dp users` | Tablo yetkileri |
| `\x` | Geniş satırları dikey göster (aç/kapat) |
| `\timing` | Sorgu süresini göster |
| `\e` | Son sorguyu editörde düzenle |
| `\i file.sql` | Dosyadaki SQL'i çalıştır |
| `\o out.txt` | Çıktıyı dosyaya yaz |
| `\conninfo` | Mevcut bağlantı bilgisi |
| `\?` / `\h SELECT` | psql yardımı / SQL komut yardımı |
| `\q` | Çıkış |

Tek bir komut çalıştırıp çıkmak için:

```bash
psql -U app -d appdb -c "SELECT count(*) FROM users;"
psql -U app -d appdb -f migration.sql
psql -U app -d appdb -At -c "SELECT email FROM users" > emails.txt   # sade çıktı
```

## 3. Veritabanı ve kullanıcı oluşturma

```sql
CREATE ROLE app WITH LOGIN PASSWORD 'secret';
CREATE DATABASE appdb OWNER app;

-- Sadece okuma yetkili kullanıcı
CREATE ROLE reporter WITH LOGIN PASSWORD 'secret2';
GRANT CONNECT ON DATABASE appdb TO reporter;
GRANT USAGE ON SCHEMA public TO reporter;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporter;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO reporter;

ALTER ROLE app WITH PASSWORD 'new-secret';
DROP ROLE reporter;
```

`ALTER DEFAULT PRIVILEGES`, ileride oluşturulacak tablolara da yetkinin otomatik verilmesini sağlar; unutulursa yeni tablolar okunamaz.

> PostgreSQL 15'ten itibaren `public` şemasında herkesin tablo oluşturma yetkisi kaldırıldı. Uygulama kullanıcısı veritabanının sahibi değilse `GRANT CREATE ON SCHEMA public TO app;` gerekebilir.

## 4. Tablo işlemleri

```sql
CREATE TABLE users (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    metadata    JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(200);
ALTER TABLE users RENAME COLUMN name TO full_name;
CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX CONCURRENTLY idx_users_meta ON users USING gin (metadata);
TRUNCATE users RESTART IDENTITY;
DROP TABLE IF EXISTS users;
```

`CREATE INDEX CONCURRENTLY` tabloyu yazmaya kilitlemeden index oluşturur; canlı sistemlerde tercih edilmelidir (transaction içinde çalıştırılamaz).

## 5. Pratik SQL kalıpları

```sql
-- Upsert
INSERT INTO users (email, name) VALUES ('a@example.com', 'A')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

-- Eklenen/güncellenen satırı geri döndür
UPDATE users SET last_login = now() WHERE id = 42 RETURNING *;

-- JSONB sorgusu
SELECT * FROM users WHERE metadata->>'plan' = 'pro';
SELECT * FROM users WHERE metadata @> '{"beta": true}';

-- Sayfalama
SELECT * FROM users ORDER BY id LIMIT 20 OFFSET 40;

-- Gruplu sayım
SELECT date_trunc('day', created_at) AS day, count(*)
FROM users GROUP BY 1 ORDER BY 1 DESC;
```

## 6. Yedekleme ve geri yükleme

```bash
# Tek veritabanı, düz SQL
pg_dump -U app -d appdb > appdb.sql

# Sıkıştırılmış custom format (önerilen)
pg_dump -U app -d appdb -Fc -f appdb.dump

# Sadece şema / sadece belirli tablo
pg_dump -U app -d appdb --schema-only > schema.sql
pg_dump -U app -d appdb -t users -Fc -f users.dump

# Geri yükleme
psql -U app -d appdb < appdb.sql
pg_restore -U app -d appdb --clean --if-exists appdb.dump
pg_restore -U app -d appdb -j 4 appdb.dump        # 4 paralel iş

# Tüm cluster (roller dahil)
pg_dumpall -U postgres > all.sql
```

Custom format (`-Fc`) hem sıkıştırılmıştır hem de `pg_restore` ile seçici ve paralel geri yüklemeye izin verir.

## 7. Performans ve sorgu analizi

```sql
EXPLAIN SELECT * FROM users WHERE email = 'a@example.com';
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users WHERE created_at > now() - interval '7 days';
```

Çıktıda büyük tablolarda `Seq Scan` görüyorsanız ve sorgu seçiciyse, ilgili kolona index eklemeyi düşünün.

Çalışan sorgular ve kilitler:

```sql
-- Aktif sorgular
SELECT pid, usename, state, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY duration DESC;

-- Sorguyu iptal et / bağlantıyı sonlandır
SELECT pg_cancel_backend(12345);
SELECT pg_terminate_backend(12345);

-- Tablo ve index boyutları
SELECT relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

SELECT pg_size_pretty(pg_database_size('appdb'));
```

## 8. Bakım

```sql
VACUUM (VERBOSE, ANALYZE) users;   -- ölü satırları temizle, istatistikleri güncelle
ANALYZE;                           -- tüm tabloların planlayıcı istatistikleri
REINDEX INDEX CONCURRENTLY idx_users_created_at;
SHOW max_connections;
SHOW config_file;
SELECT version();
```

Autovacuum varsayılan olarak açıktır ve çoğu durumda elle `VACUUM` gerekmez; ancak toplu silme/güncelleme sonrasında `VACUUM ANALYZE` çalıştırmak planlayıcının doğru kararlar vermesine yardımcı olur.

## 9. Sorun giderme

| Hata | Sebep / Çözüm |
| --- | --- |
| `FATAL: password authentication failed` | Şifre yanlış ya da `pg_hba.conf` yöntemi uyuşmuyor |
| `FATAL: no pg_hba.conf entry for host` | İstemci IP'si `pg_hba.conf`'ta yok; ekleyip `SELECT pg_reload_conf();` |
| `Connection refused` | Sunucu çalışmıyor ya da `listen_addresses` sadece `localhost` |
| `permission denied for table` | `GRANT SELECT/INSERT ...` eksik; `\dp tablo` ile kontrol edin |
| `too many connections` | Uygulamada connection pool kullanın (HikariCP, PgBouncer); `max_connections`'ı körü körüne artırmayın |
| Sorgu takılı kaldı | `pg_stat_activity` ve `pg_locks` ile bloklayan sorguyu bulun |

## Sonuç

`psql`'in meta komutlarını (`\l`, `\c`, `\dt`, `\d`, `\x`, `\timing`) öğrenmek, veritabanında gezinmeyi GUI'den daha hızlı hale getirir. Bunun üzerine `pg_dump -Fc` ile düzenli yedek, `EXPLAIN ANALYZE` ile sorgu analizi ve `pg_stat_activity` ile canlı izleme eklendiğinde, PostgreSQL ile ilgili günlük işlerin büyük kısmı tek bir terminalden yürür.
