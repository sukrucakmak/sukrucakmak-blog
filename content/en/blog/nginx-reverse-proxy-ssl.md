---
title: Setting Up an Nginx Reverse Proxy with Let's Encrypt SSL
description: "Putting a Node.js or Spring Boot app behind Nginx, getting a free SSL certificate with Certbot, and setting up automatic renewal."
date: 2026-10-28
tags: [nginx, linux, devops, guide]
translation: /blog/nginx-reverse-proxy-ssl
---

## Introduction

Instead of exposing your app directly on `:3000` or `:8080`, putting a reverse proxy in front of it is the standard approach for both security and operations. In that role Nginx:

- listens on ports 80/443 and forwards requests to the app behind it,
- terminates SSL/TLS, so your app keeps speaking plain HTTP,
- handles static files, gzip compression and multiple domains.

In this post we'll publish an app running on `localhost:3000` at `app.example.com` over HTTPS. Commands are for Ubuntu/Debian; AlmaLinux/RHEL differences are noted.

## 1. Installing Nginx

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y nginx

# AlmaLinux / RHEL
sudo dnf install -y nginx

sudo systemctl enable --now nginx
sudo systemctl status nginx
```

If a firewall is enabled, allow 80 and 443:

```bash
# Ubuntu (ufw)
sudo ufw allow 'Nginx Full'

# AlmaLinux (firewalld)
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```

> Before continuing, `app.example.com` needs a DNS **A record** pointing to the server's IP. Let's Encrypt verifies that you own the domain through it.

## 2. The reverse proxy block

On Ubuntu, site files live in `/etc/nginx/sites-available/` and are linked into `sites-enabled/`. On AlmaLinux, simply create `/etc/nginx/conf.d/app.conf`.

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

        # WebSocket support
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 60s;
    }

    client_max_body_size 20M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/app.example.com /etc/nginx/sites-enabled/
sudo nginx -t                 # test the configuration
sudo systemctl reload nginx   # reload without downtime
```

The `X-Forwarded-*` headers let the app know the real client IP and that the request came in over HTTPS. Spring Boot honors them with `server.forward-headers-strategy=framework`, Express with `app.set('trust proxy', 1)`.

## 3. SSL certificate with Certbot

```bash
# Ubuntu / Debian
sudo apt install -y certbot python3-certbot-nginx

# AlmaLinux / RHEL (requires EPEL)
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx

sudo certbot --nginx -d app.example.com
```

Certbot verifies the domain, stores the certificate under `/etc/letsencrypt/live/app.example.com/`, and adds the `listen 443 ssl` block and the HTTP → HTTPS redirect to your Nginx config itself. For several domains, repeat `-d`:

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

## 4. Automatic renewal

Let's Encrypt certificates are valid for 90 days. The Certbot package installs a systemd timer for renewal:

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run    # test renewal
sudo certbot certificates       # certificates and expiry dates
```

On AlmaLinux the timer may be disabled by default:

```bash
sudo systemctl enable --now certbot-renew.timer
```

## 5. Configuration after SSL

It's good practice to add a few security and performance settings to the file Certbot edited:

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
        # ... the proxy_set_header lines from before
    }
}

server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;
}
```

> The `http2 on;` directive arrived in Nginx 1.25.1. On older versions write `listen 443 ssl http2;`; check your version with `nginx -v`.

## 6. Several apps, one server

To route different domains to different ports on the same server, write a separate `server` block for each. Splitting by path under a single domain also works:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/;   # trailing / → /api/users → /users
}

location / {
    root /var/www/frontend;
    try_files $uri $uri/ /index.html;    # SPA fallback
}
```

The trailing `/` on `proxy_pass` matters: with it the matched `/api/` prefix is stripped, without it the request is forwarded as is.

## 7. Everyday commands

```bash
sudo nginx -t                         # syntax check
sudo nginx -T                         # dump the full merged configuration
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
curl -I https://app.example.com       # response headers
```

## 8. Troubleshooting

| Error | Cause / Fix |
| --- | --- |
| `502 Bad Gateway` | The backend isn't running or the port is wrong; check with `curl localhost:3000` |
| 502 on AlmaLinux while the app runs | SELinux blocks Nginx network connections: `sudo setsebool -P httpd_can_network_connect 1` |
| `504 Gateway Timeout` | The app responds slowly; raise `proxy_read_timeout` |
| `413 Request Entity Too Large` | Raise `client_max_body_size` |
| Certbot validation fails | Wrong DNS A record or port 80 closed |
| The app generates `http://` redirects | `X-Forwarded-Proto` is missing or the app doesn't trust proxy headers |

## Conclusion

Nginx + Certbot is the most common way to put any app on HTTPS in a few minutes. Things to remember: `nginx -t` after every change, `reload` instead of `restart`, pass the `X-Forwarded-*` headers to the app, and confirm renewal works once with `certbot renew --dry-run`.
