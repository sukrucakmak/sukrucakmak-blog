---
title: PostgreSQL and psql Basics
description: "Connecting with psql, meta-commands (\\l, \\dt, \\d), users and privileges, backup/restore, query analysis and day-to-day maintenance commands."
date: 2026-11-02
tags: [postgresql, database, guide]
translation: /blog/postgresql-psql-commands
---

## Introduction

PostgreSQL is one of the most popular relational databases in the open-source world. `psql` is its command-line client: faster than GUI tools, always available on the server, and scriptable.

This post collects the `psql` commands and SQL patterns used most in daily work.

## 1. Connecting

```bash
psql -U app -d appdb                         # local
psql -h db.example.com -p 5432 -U app -d appdb
psql "postgresql://app:secret@localhost:5432/appdb"
sudo -u postgres psql                        # as the superuser (Linux)
docker compose exec db psql -U app -d appdb  # inside a container
```

To avoid typing the password every time, use a `~/.pgpass` file (permissions must be `600`):

```bash
# host:port:database:user:password
localhost:5432:appdb:app:secret
```

## 2. psql meta-commands

Commands starting with a backslash aren't SQL but psql's own commands, and need no semicolon.

| Command | Description |
| --- | --- |
| `\l` | List databases |
| `\c appdb` | Switch to another database |
| `\dn` | Schemas |
| `\dt` | Tables (`\dt *.*` for all schemas) |
| `\d users` | A table's columns, indexes and constraints |
| `\d+ users` | Plus size and comments |
| `\di` | Indexes |
| `\dv` | Views |
| `\df` | Functions |
| `\du` | Users/roles |
| `\dp users` | Table privileges |
| `\x` | Toggle vertical display for wide rows |
| `\timing` | Show query duration |
| `\e` | Edit the last query in an editor |
| `\i file.sql` | Run SQL from a file |
| `\o out.txt` | Write output to a file |
| `\conninfo` | Current connection info |
| `\?` / `\h SELECT` | psql help / SQL command help |
| `\q` | Quit |

To run a single command and exit:

```bash
psql -U app -d appdb -c "SELECT count(*) FROM users;"
psql -U app -d appdb -f migration.sql
psql -U app -d appdb -At -c "SELECT email FROM users" > emails.txt   # bare output
```

## 3. Creating databases and users

```sql
CREATE ROLE app WITH LOGIN PASSWORD 'secret';
CREATE DATABASE appdb OWNER app;

-- Read-only user
CREATE ROLE reporter WITH LOGIN PASSWORD 'secret2';
GRANT CONNECT ON DATABASE appdb TO reporter;
GRANT USAGE ON SCHEMA public TO reporter;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporter;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO reporter;

ALTER ROLE app WITH PASSWORD 'new-secret';
DROP ROLE reporter;
```

`ALTER DEFAULT PRIVILEGES` grants the privilege automatically on tables created later; forget it and new tables won't be readable.

> Since PostgreSQL 15, everyone's right to create tables in the `public` schema has been removed. If the app user doesn't own the database, you may need `GRANT CREATE ON SCHEMA public TO app;`.

## 4. Working with tables

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

`CREATE INDEX CONCURRENTLY` builds the index without locking the table for writes; prefer it on live systems (it can't run inside a transaction).

## 5. Practical SQL patterns

```sql
-- Upsert
INSERT INTO users (email, name) VALUES ('a@example.com', 'A')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

-- Return the inserted/updated row
UPDATE users SET last_login = now() WHERE id = 42 RETURNING *;

-- JSONB queries
SELECT * FROM users WHERE metadata->>'plan' = 'pro';
SELECT * FROM users WHERE metadata @> '{"beta": true}';

-- Pagination
SELECT * FROM users ORDER BY id LIMIT 20 OFFSET 40;

-- Grouped counts
SELECT date_trunc('day', created_at) AS day, count(*)
FROM users GROUP BY 1 ORDER BY 1 DESC;
```

## 6. Backup and restore

```bash
# Single database, plain SQL
pg_dump -U app -d appdb > appdb.sql

# Compressed custom format (recommended)
pg_dump -U app -d appdb -Fc -f appdb.dump

# Schema only / a single table
pg_dump -U app -d appdb --schema-only > schema.sql
pg_dump -U app -d appdb -t users -Fc -f users.dump

# Restore
psql -U app -d appdb < appdb.sql
pg_restore -U app -d appdb --clean --if-exists appdb.dump
pg_restore -U app -d appdb -j 4 appdb.dump        # 4 parallel jobs

# The whole cluster (including roles)
pg_dumpall -U postgres > all.sql
```

The custom format (`-Fc`) is compressed and allows selective and parallel restores with `pg_restore`.

## 7. Performance and query analysis

```sql
EXPLAIN SELECT * FROM users WHERE email = 'a@example.com';
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users WHERE created_at > now() - interval '7 days';
```

If you see a `Seq Scan` on a large table for a selective query, consider indexing that column.

Running queries and locks:

```sql
-- Active queries
SELECT pid, usename, state, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY duration DESC;

-- Cancel a query / terminate a connection
SELECT pg_cancel_backend(12345);
SELECT pg_terminate_backend(12345);

-- Table and index sizes
SELECT relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

SELECT pg_size_pretty(pg_database_size('appdb'));
```

## 8. Maintenance

```sql
VACUUM (VERBOSE, ANALYZE) users;   -- clean up dead rows, refresh statistics
ANALYZE;                           -- planner statistics for all tables
REINDEX INDEX CONCURRENTLY idx_users_created_at;
SHOW max_connections;
SHOW config_file;
SELECT version();
```

Autovacuum is on by default and manual `VACUUM` is rarely needed; still, running `VACUUM ANALYZE` after bulk deletes/updates helps the planner make the right decisions.

## 9. Troubleshooting

| Error | Cause / Fix |
| --- | --- |
| `FATAL: password authentication failed` | Wrong password or the `pg_hba.conf` method doesn't match |
| `FATAL: no pg_hba.conf entry for host` | The client IP isn't in `pg_hba.conf`; add it and run `SELECT pg_reload_conf();` |
| `Connection refused` | The server isn't running or `listen_addresses` is only `localhost` |
| `permission denied for table` | Missing `GRANT SELECT/INSERT ...`; check with `\dp table` |
| `too many connections` | Use a connection pool in the app (HikariCP, PgBouncer); don't blindly raise `max_connections` |
| A query hangs | Find the blocking query with `pg_stat_activity` and `pg_locks` |

## Conclusion

Learning `psql`'s meta-commands (`\l`, `\c`, `\dt`, `\d`, `\x`, `\timing`) makes navigating a database faster than any GUI. Add regular backups with `pg_dump -Fc`, query analysis with `EXPLAIN ANALYZE` and live monitoring with `pg_stat_activity`, and most day-to-day PostgreSQL work runs from a single terminal.
