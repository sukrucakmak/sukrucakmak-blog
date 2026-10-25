---
title: GitHub Actions ile CI/CD — Build, Test ve Sunucuya Deploy
description: "Bir projeyi her push'ta build edip test eden, main'e merge edilince SSH ile kendi sunucunuza deploy eden GitHub Actions workflow'u adım adım."
date: 2026-10-29
tags: [github, ci-cd, devops, rehber]
translation: /en/blog/github-actions-ci-cd
---

## Giriş

GitHub Actions, repo içindeki `.github/workflows/*.yml` dosyalarıyla tanımlanan, GitHub'ın kendi altyapısında çalışan bir CI/CD sistemidir. Public repolar için ücretsizdir, private repolarda da aylık ücretsiz dakika kotası vardır.

Bu yazıda şu akışı kuracağız:

1. Her push ve pull request'te: bağımlılıkları kur, build et, testleri çalıştır.
2. `main` branch'ine merge edilince: çıktıyı SSH ile kendi sunucumuza kopyala ve uygulamayı yeniden başlat.

Bu blog da tam olarak bu yöntemle deploy ediliyor.

## 1. Temel kavramlar

| Kavram | Anlamı |
| --- | --- |
| Workflow | `.github/workflows/` altındaki bir YAML dosyası |
| Event (`on`) | Workflow'u tetikleyen olay: `push`, `pull_request`, `schedule`, `workflow_dispatch` |
| Job | Aynı runner üzerinde sırayla çalışan adımlar grubu; job'lar varsayılan olarak paralel çalışır |
| Step | Tek bir komut (`run`) ya da hazır bir action (`uses`) |
| Runner | Job'u çalıştıran makine: `ubuntu-latest`, `windows-latest`, `macos-latest` ya da self-hosted |
| Secret | Repo ayarlarında saklanan, loglarda maskelenen gizli değer |

## 2. CI: build ve test

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

Java/Maven projesi için aynı iskelet:

```yaml
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
          cache: maven

      - run: ./mvnw -B verify
```

`cache` parametresi bağımlılıkları (npm, Maven, Gradle) çalıştırmalar arasında saklar; build süresini ciddi ölçüde kısaltır.

## 3. Matrix ile birden fazla sürümde test

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
```

Bu tanım aynı job'u üç Node sürümüyle paralel olarak çalıştırır.

## 4. Secret'lar

Sunucu adresi, SSH anahtarı gibi değerler repoya yazılmaz; **Settings → Secrets and variables → Actions** altına eklenir ya da `gh` CLI ile tanımlanır:

```bash
gh secret set DEPLOY_HOST --body "203.0.113.10"
gh secret set DEPLOY_USER --body "deploy"
gh secret set DEPLOY_SSH_KEY < ~/.ssh/deploy_key
gh secret list
```

Workflow içinde `${{ secrets.DEPLOY_HOST }}` şeklinde kullanılır. Secret'lar loglarda `***` olarak maskelenir ve fork'lardan açılan PR'lara verilmez.

Deploy için ayrı bir anahtar çifti üretip public anahtarı sunucudaki deploy kullanıcısının `~/.ssh/authorized_keys` dosyasına ekleyin:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "github-actions" -N ""
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@203.0.113.10
```

## 5. CD: SSH ile sunucuya deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm test
      - run: npm run build

      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H "${{ secrets.DEPLOY_HOST }}" >> ~/.ssh/known_hosts

      - name: Upload
        run: |
          rsync -az --delete dist/ \
            "${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:/var/www/app/"

      - name: Restart
        run: |
          ssh "${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}" \
            "cd /var/www/app && npm ci --omit=dev && pm2 reload app"
```

Önemli noktalar:

- **`concurrency`**, art arda iki merge geldiğinde deploy'ların üst üste binmesini engeller.
- **`environment: production`**, GitHub'da onay kuralı (required reviewers) ve environment'a özel secret tanımlamanıza izin verir.
- **`rsync --delete`**, sunucuda artık build çıktısında olmayan dosyaları da siler.
- **`workflow_dispatch`**, workflow'u Actions sekmesinden elle çalıştırmak için bir buton ekler.

## 6. Zamanlanmış çalıştırma

`schedule` ile workflow'u cron ifadesiyle periyodik çalıştırabilirsiniz. Saatler **UTC**'dir:

```yaml
on:
  schedule:
    - cron: '0 3 * * *'     # her gün 03:00 UTC (06:00 TR)
```

Gece testleri, bağımlılık taramaları ya da bu blogdaki gibi zamanlanmış içerik yayını için kullanışlıdır. Yoğun saatlerde birkaç dakika gecikmeyle başlayabileceğini unutmayın.

## 7. Job'lar arası bağımlılık ve artifact

Build'i bir kez yapıp çıktıyı deploy job'una aktarmak için:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      # ... rsync adımları
```

## 8. gh CLI ile workflow yönetimi

```bash
gh workflow list
gh workflow run deploy.yml            # workflow_dispatch tetikle
gh run list --workflow=deploy.yml
gh run watch                          # çalışan run'ı canlı izle
gh run view --log-failed              # başarısız adımların logları
gh run rerun --failed
```

## 9. Sorun giderme

| Sorun | Çözüm |
| --- | --- |
| `Permission denied (publickey)` | Secret'taki private key eksik/bozuk ya da public key `authorized_keys`'te yok |
| `Host key verification failed` | `ssh-keyscan` adımı eksik ya da yanlış host |
| Secret boş geliyor | Fork'tan açılan PR'larda secret verilmez; isim büyük/küçük harf duyarlıdır |
| Cache hiç tutmuyor | Lock dosyası (`package-lock.json`) repoda olmalı |
| Zamanlanmış workflow çalışmıyor | Sadece varsayılan branch'teki dosya geçerlidir; 60 gün aktivite olmayan repolarda otomatik devre dışı kalır |

## Sonuç

Birkaç düzine satırlık bir YAML ile her değişikliğin test edildiği ve `main`'e merge edildiği anda canlıya çıktığı bir akış kurmak mümkün. Başlangıç için tek bir `ci.yml` yeterli; deploy, matrix ve zamanlanmış görevleri ihtiyaç doğdukça ekleyebilirsiniz. Secret'ları repoya yazmamak ve deploy için ayrı, sınırlı yetkili bir SSH anahtarı kullanmak ise baştan uyulması gereken iki kuraldır.
