---
title: Docker Compose ile Çoklu Servis Çalıştırma
description: "Uygulama, veritabanı ve cache'i tek bir compose.yaml ile ayağa kaldırmak — servisler, network, volume, healthcheck, env dosyaları ve sık kullanılan komutlar."
date: 2026-10-27
tags: [docker, devops, rehber]
translation: /en/blog/docker-compose-guide
---

## Giriş

Tek bir container'ı `docker run` ile çalıştırmak kolaydır; ama gerçek bir uygulama genelde bir API, bir veritabanı, bir cache ve belki bir reverse proxy'den oluşur. Bunları tek tek `docker run` komutlarıyla, doğru network ve volume ayarlarıyla başlatmak hem zahmetli hem de hataya açıktır.

Docker Compose bu servislerin hepsini tek bir YAML dosyasında tanımlamanızı ve tek komutla yönetmenizi sağlar. Bu yazıda bir Spring Boot API + PostgreSQL + Redis örneği üzerinden ilerleyeceğiz.

> Compose artık Docker CLI'ın bir parçası: komut `docker-compose` değil `docker compose`. Dosya adı olarak da `compose.yaml` önerilir; `docker-compose.yml` hâlâ çalışır.

## 1. İlk compose.yaml

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

Burada dikkat edilmesi gereken birkaç nokta var:

- **Servis adları DNS adıdır.** `api` container'ı veritabanına `localhost` ile değil `db` ile bağlanır. Compose tüm servisleri ortak bir network'e koyar.
- **`ports` sadece dışarıya açılacak servislerde gerekir.** `db` ve `cache` host'a port açmadığı için sadece compose network'ü içinden erişilebilir.
- **`depends_on` + `condition: service_healthy`**, API'nin veritabanı gerçekten bağlantı kabul etmeye başlayana kadar beklemesini sağlar. Sadece `depends_on: [db]` yazmak container'ın başlamasını bekler, hazır olmasını değil.
- **Named volume'ler** (`pgdata`, `redisdata`) `docker compose down` sonrası da kalır; veriniz kaybolmaz.

## 2. Ortam değişkenleri ve .env

`${DB_PASSWORD}` gibi değişkenler, `compose.yaml` ile aynı klasördeki `.env` dosyasından okunur:

```bash
# .env
DB_PASSWORD=local-dev-password
COMPOSE_PROJECT_NAME=myapp
```

Container'a çok sayıda değişken geçirmek için `env_file` daha temizdir:

```yaml
services:
  api:
    env_file:
      - .env.api
```

> `.env` dosyalarını `.gitignore`'a ekleyin, repoya bunun yerine `.env.example` koyun.

Compose'un değişkenleri nasıl çözdüğünü görmek için:

```bash
docker compose config        # değişkenleri yerleştirilmiş son hali yazdırır
```

## 3. Sık kullanılan komutlar

```bash
docker compose up -d                 # tüm servisleri arka planda başlat
docker compose up -d --build         # image'ları yeniden build edip başlat
docker compose up -d api             # sadece api (ve bağımlılıkları)
docker compose ps                    # servislerin durumu
docker compose logs -f api           # api loglarını canlı izle
docker compose logs --tail=100       # tüm servislerin son 100 satırı
docker compose exec db psql -U app   # çalışan container'da komut
docker compose run --rm api sh       # tek seferlik yeni container
docker compose restart api
docker compose stop                  # durdur, container'ları silme
docker compose down                  # durdur ve container + network'ü sil
docker compose down -v               # volume'leri de sil (veri gider!)
docker compose pull                  # image'ların yeni sürümlerini çek
docker compose build --no-cache api
docker compose top                   # container'lardaki süreçler
```

| Komut | Container | Network | Volume |
| --- | --- | --- | --- |
| `stop` | Durur, kalır | Kalır | Kalır |
| `down` | Silinir | Silinir | Kalır |
| `down -v` | Silinir | Silinir | Silinir |

## 4. Geliştirme ortamı için override

Compose, `compose.yaml` ile birlikte aynı klasördeki `compose.override.yaml` dosyasını da otomatik okur. Geliştirmeye özel ayarları buraya koymak, ana dosyayı production'a yakın tutar:

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
      - "5432:5432"     # DBeaver vb. ile bağlanmak için
```

Production'da farklı bir dosya kullanmak için `-f` ile dosyaları açıkça belirtin:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

## 5. Profiller

Her zaman çalışması gerekmeyen servisleri (ör. pgAdmin, mail test sunucusu) profile bağlayabilirsiniz:

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
docker compose up -d                     # pgadmin başlamaz
docker compose --profile tools up -d     # pgadmin de başlar
```

## 6. Kaynak limitleri ve restart politikası

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

| `restart` değeri | Davranış |
| --- | --- |
| `no` | Varsayılan, yeniden başlatmaz |
| `always` | Her durumda yeniden başlatır |
| `on-failure` | Sadece hata koduyla çıkarsa |
| `unless-stopped` | Elle durdurulmadıkça yeniden başlatır |

## 7. Sorun giderme

| Sorun | Çözüm |
| --- | --- |
| `Connection refused` → `localhost:5432` | Container içinden servis adını kullanın: `db:5432` |
| API veritabanından önce başlayıp çöküyor | `depends_on` + `condition: service_healthy` ve `healthcheck` ekleyin |
| `port is already allocated` | Host'ta aynı portu kullanan süreç var; `ss -ltnp` ile bulun ya da port eşlemesini değiştirin |
| Kod değişikliği container'a yansımıyor | `docker compose up -d --build` ile image'ı yeniden build edin |
| Veritabanı şifresini değiştirdim ama eskisi geçerli | Postgres şifreyi ilk kurulumda volume'e yazar; `down -v` ile volume'ü silin (veri gider) |
| `.env` değişkenleri boş geliyor | `docker compose config` ile kontrol edin; `.env` compose dosyasıyla aynı klasörde olmalı |

## Sonuç

Docker Compose, birden fazla servisten oluşan bir uygulamayı tek dosyayla tanımlamanın ve herkesin aynı ortamı tek komutla kurmasının en pratik yoludur. Servis adlarının DNS adı olduğunu, `healthcheck` ile başlatma sırasını kontrol etmeyi ve `down -v`'nin veriyi sildiğini akılda tutmak, karşılaşılan sorunların çoğunu baştan önler.
