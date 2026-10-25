---
title: Running Multiple Services with Docker Compose
description: "Bringing up an app, a database and a cache from a single compose.yaml — services, networks, volumes, healthchecks, env files and everyday commands."
date: 2026-10-27
tags: [docker, devops, guide]
translation: /blog/docker-compose-guide
---

## Introduction

Running a single container with `docker run` is easy; but a real application usually consists of an API, a database, a cache and maybe a reverse proxy. Starting each of them with separate `docker run` commands and the right network and volume settings is tedious and error-prone.

Docker Compose lets you define all of these services in one YAML file and manage them with a single command. This post walks through a Spring Boot API + PostgreSQL + Redis example.

> Compose is now part of the Docker CLI: the command is `docker compose`, not `docker-compose`. The recommended file name is `compose.yaml`; `docker-compose.yml` still works.

## 1. A first compose.yaml

```yaml
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/app
      SPRING_DATASOURCE_USERNAME: app
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_DATA_REDIS_HOST: cache
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:17
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

  cache:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

A few things to note:

- **Service names are DNS names.** The `api` container reaches the database at `db`, not `localhost`. Compose puts all services on a shared network.
- **`ports` is only needed for services exposed to the outside.** `db` and `cache` publish no host ports, so they're reachable only from inside the compose network.
- **`depends_on` + `condition: service_healthy`** makes the API wait until the database actually accepts connections. Plain `depends_on: [db]` only waits for the container to start, not to be ready.
- **Named volumes** (`pgdata`, `redisdata`) survive `docker compose down`; your data isn't lost.

## 2. Environment variables and .env

Variables like `${DB_PASSWORD}` are read from a `.env` file next to `compose.yaml`:

```bash
# .env
DB_PASSWORD=local-dev-password
COMPOSE_PROJECT_NAME=myapp
```

To pass many variables into a container, `env_file` is cleaner:

```yaml
services:
  api:
    env_file:
      - .env.api
```

> Add `.env` files to `.gitignore` and commit a `.env.example` instead.

To see how Compose resolves the variables:

```bash
docker compose config        # prints the final file with variables substituted
```

## 3. Everyday commands

```bash
docker compose up -d                 # start all services in the background
docker compose up -d --build         # rebuild images, then start
docker compose up -d api             # only api (and its dependencies)
docker compose ps                    # service status
docker compose logs -f api           # follow api logs
docker compose logs --tail=100       # last 100 lines of every service
docker compose exec db psql -U app   # run a command in a running container
docker compose run --rm api sh       # one-off new container
docker compose restart api
docker compose stop                  # stop, keep containers
docker compose down                  # stop and remove containers + network
docker compose down -v               # remove volumes too (data is lost!)
docker compose pull                  # pull newer image versions
docker compose build --no-cache api
docker compose top                   # processes in the containers
```

| Command | Containers | Network | Volumes |
| --- | --- | --- | --- |
| `stop` | Stopped, kept | Kept | Kept |
| `down` | Removed | Removed | Kept |
| `down -v` | Removed | Removed | Removed |

## 4. Overrides for development

Compose automatically reads `compose.override.yaml` alongside `compose.yaml`. Putting development-only settings there keeps the main file close to production:

```yaml
# compose.override.yaml
services:
  api:
    environment:
      SPRING_PROFILES_ACTIVE: dev
    ports:
      - "5005:5005"     # remote debug
  db:
    ports:
      - "5432:5432"     # to connect with DBeaver etc.
```

To use a different file in production, list the files explicitly with `-f`:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

## 5. Profiles

Services that don't always need to run (e.g. pgAdmin, a mail test server) can be tied to a profile:

```yaml
services:
  pgadmin:
    image: dpage/pgadmin4
    profiles: ["tools"]
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
```

```bash
docker compose up -d                     # pgadmin doesn't start
docker compose --profile tools up -d     # pgadmin starts too
```

## 6. Resource limits and restart policy

```yaml
services:
  api:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
```

| `restart` value | Behavior |
| --- | --- |
| `no` | Default, never restarts |
| `always` | Always restarts |
| `on-failure` | Only when it exits with an error code |
| `unless-stopped` | Restarts unless stopped manually |

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| `Connection refused` → `localhost:5432` | From inside a container use the service name: `db:5432` |
| API starts before the database and crashes | Add `depends_on` + `condition: service_healthy` and a `healthcheck` |
| `port is already allocated` | Something on the host uses that port; find it with `ss -ltnp` or change the mapping |
| Code changes don't reach the container | Rebuild the image with `docker compose up -d --build` |
| Changed the DB password but the old one still works | Postgres writes the password to the volume on first init; remove it with `down -v` (data is lost) |
| `.env` variables come through empty | Check with `docker compose config`; `.env` must sit next to the compose file |

## Conclusion

Docker Compose is the most practical way to define a multi-service application in one file and let everyone bring up the same environment with one command. Remembering that service names are DNS names, controlling startup order with a `healthcheck`, and knowing that `down -v` deletes data prevents most of the problems you'll run into.
