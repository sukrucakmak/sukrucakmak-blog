---
title: Nginx Reverse Proxy ve Let's Encrypt SSL Kurulumu
description: "Bir Node.js ya da Spring Boot uygulamasını Nginx arkasına almak, Certbot ile ücretsiz SSL sertifikası almak ve otomatik yenilemeyi kurmak."
date: 2026-10-28
tags: [nginx, linux, devops, rehber]
translation: /en/blog/nginx-reverse-proxy-ssl
---

## Giriş

Uygulamanızı doğrudan `:3000` ya da `:8080` portundan internete açmak yerine önüne bir reverse proxy koymak hem güvenlik hem de yönetim açısından standart yaklaşımdır. Nginx bu rolde:

- 80/443 portlarını dinler, istekleri arkadaki uygulamaya iletir,
- SSL/TLS'i sonlandırır; uygulamanız düz HTTP konuşmaya devam eder,
- statik dosyaları, gzip sıkıştırmayı ve birden fazla domain'i yönetir.

Bu yazıda `localhost:3000`'de çalışan bir uygulamayı `app.example.com` adresinden HTTPS ile yayınlayacağız. Komutlar Ubuntu/Debian için yazıldı; AlmaLinux/RHEL farkları ayrıca belirtildi.

## 1. Nginx kurulumu

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y nginx

# AlmaLinux / RHEL
sudo dnf install -y nginx

sudo systemctl enable --now nginx
sudo systemctl status nginx
```

Firewall açıksa 80 ve 443'e izin verin:

```bash
# Ubuntu (ufw)
sudo ufw allow 'Nginx Full'

# AlmaLinux (firewalld)
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```

> Devam etmeden önce `app.example.com` için DNS'te sunucunun IP'sini gösteren bir **A kaydı** olmalı. Let's Encrypt domain'in size ait olduğunu bu kayıt üzerinden doğrular.

## 2. Reverse proxy tanımı

Ubuntu'da site dosyaları `/etc/nginx/sites-available/` altında durur ve `sites-enabled/`'a link verilir. AlmaLinux'ta doğrudan `/etc/nginx/conf.d/app.conf` dosyası oluşturmanız yeterlidir.

```nginx
# /etc/nginx/sites-available/app.example.com
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket desteği
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 60s;
    }

    client_max_body_size 20M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/app.example.com /etc/nginx/sites-enabled/
sudo nginx -t                 # yapılandırmayı test et
sudo systemctl reload nginx   # kesinti olmadan yeniden yükle
```

`X-Forwarded-*` başlıkları uygulamanın gerçek istemci IP'sini ve isteğin HTTPS ile geldiğini bilmesini sağlar. Spring Boot'ta `server.forward-headers-strategy=framework`, Express'te `app.set('trust proxy', 1)` ile bu başlıklar dikkate alınır.

## 3. Certbot ile SSL sertifikası

```bash
# Ubuntu / Debian
sudo apt install -y certbot python3-certbot-nginx

# AlmaLinux / RHEL (EPEL gerekir)
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx

sudo certbot --nginx -d app.example.com
```

Certbot domain'i doğrular, sertifikayı `/etc/letsencrypt/live/app.example.com/` altına koyar ve Nginx yapılandırmanıza `listen 443 ssl` bloğunu ve HTTP → HTTPS yönlendirmesini kendisi ekler. Birden fazla domain için `-d` parametresini tekrarlayın:

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

## 4. Otomatik yenileme

Let's Encrypt sertifikaları 90 gün geçerlidir. Certbot paketi yenileme için bir systemd timer kurar:

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run    # yenilemeyi test et
sudo certbot certificates       # sertifikalar ve bitiş tarihleri
```

AlmaLinux'ta timer varsayılan olarak kapalı olabilir:

```bash
sudo systemctl enable --now certbot-renew.timer
```

## 5. SSL sonrası yapılandırma

Certbot'un düzenlediği dosyaya birkaç güvenlik ve performans ayarı eklemek iyi bir pratiktir:

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name app.example.com;

    ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        # ... önceki proxy_set_header satırları
    }
}

server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;
}
```

> `http2 on;` yönergesi Nginx 1.25.1 ile geldi. Daha eski sürümlerde `listen 443 ssl http2;` yazın; sürümü `nginx -v` ile görebilirsiniz.

## 6. Birden fazla uygulama, tek sunucu

Aynı sunucuda farklı domain'leri farklı portlara yönlendirmek için her biri için ayrı bir `server` bloğu yazmanız yeterli. Tek domain altında path'e göre ayırmak da mümkündür:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/;   # sondaki / → /api/users → /users
}

location / {
    root /var/www/frontend;
    try_files $uri $uri/ /index.html;    # SPA yönlendirmesi
}
```

`proxy_pass` adresinin sonundaki `/` önemlidir: varsa eşleşen `/api/` ön eki atılır, yoksa istek olduğu gibi iletilir.

## 7. Sık kullanılan komutlar

```bash
sudo nginx -t                         # sözdizimi kontrolü
sudo nginx -T                         # tüm yapılandırmayı birleşik göster
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
curl -I https://app.example.com       # yanıt başlıkları
```

## 8. Sorun giderme

| Hata | Sebep / Çözüm |
| --- | --- |
| `502 Bad Gateway` | Arka uygulama çalışmıyor ya da port yanlış; `curl localhost:3000` ile kontrol edin |
| AlmaLinux'ta 502, uygulama çalışıyor | SELinux Nginx'in ağ bağlantısını engelliyor: `sudo setsebool -P httpd_can_network_connect 1` |
| `504 Gateway Timeout` | Uygulama geç yanıt veriyor; `proxy_read_timeout` değerini artırın |
| `413 Request Entity Too Large` | `client_max_body_size` değerini artırın |
| Certbot doğrulaması başarısız | DNS A kaydı yanlış ya da 80 portu kapalı |
| Uygulama yönlendirmelerde `http://` üretiyor | `X-Forwarded-Proto` başlığı eksik ya da uygulama proxy başlıklarına güvenmiyor |

## Sonuç

Nginx + Certbot ikilisi, herhangi bir uygulamayı birkaç dakikada HTTPS ile yayınlamanın en yaygın yoludur. Akılda tutulacaklar: her değişiklikten sonra `nginx -t`, `restart` yerine `reload`, `X-Forwarded-*` başlıklarını uygulamaya iletmek ve yenilemenin çalıştığını `certbot renew --dry-run` ile bir kez doğrulamak.
