# Deploy — sukrucakmak.com (AlmaLinux + nginx)

`main` branch'ine her merge'de `.github/workflows/deploy.yml` çalışır:
`npm ci` → `npm run generate` → `.output/public/` içeriği rsync ile
sunucudaki `DEPLOY_PATH`'e kopyalanır.

## 1. Repo secrets (Settings → Secrets and variables → Actions)

| Secret | Değer |
|---|---|
| `DEPLOY_SERVER` | Sunucunun IP'si veya `sukrucakmak.com` |
| `DEPLOY_USER` | `sukrucakmakcom` |
| `DEPLOY_SSH_KEY` | `sukrucakmakcom` kullanıcısının private key'i (satır sonlarıyla, `-----BEGIN OPENSSH PRIVATE KEY-----` dahil tamamı) |
| `DEPLOY_PATH` | `/var/www/sukrucakmak.com` |
| `DEPLOY_PORT` | Opsiyonel — yoksa 22 kullanılır |

## 2. Sunucu hazırlığı (bir kere, sırayla)

```bash
# --- Adım 1: Plesk'in web sunucularını devreden çıkar (80/443'i boşalt) ---
sudo systemctl disable --now httpd apache2 2>/dev/null
sudo systemctl disable --now sw-engine sw-cp-server 2>/dev/null   # Plesk'in kendi nginx'i
# (Plesk paneli kendini de kapatacaksan panelden Apache/nginx servislerini durdur)

# --- Adım 2: nginx kur ---
sudo dnf install -y nginx

# --- Adım 3: deploy kullanıcısını aç ---
# NOT: home'u /home altında tut — /var/lib gibi özel konumlarda SELinux
# authorized_keys'i sshd'ye okutamaz (pubkey reddedilir).
sudo useradd -m -d /home/sukrucakmakcom -s /bin/bash sukrucakmakcom
# Kullanıcıya parola koyma; ama '!' (kilitli) bırakma — RHEL ailesinde kilitli
# hesap pubkey auth'u da reddeder. '*' = parolasız ama açık:
sudo usermod -p '*' sukrucakmakcom

# --- Adım 4: SSH key pair üret (kendi bilgisayarında ya da sunucuda) ---
ssh-keygen -t ed25519 -f deploy_key -C "github-actions-sukrucakmak.com"
#   - deploy_key        → PRIVATE: GitHub secret DEPLOY_SSH_KEY'e yapıştır (dosyanın tamamı)
#   - deploy_key.pub    → PUBLIC: sunucuda authorized_keys'e ekle (aşağıda)

# --- Adım 5: public key'i kullanıcıya bağla ---
sudo mkdir -p /home/sukrucakmakcom/.ssh
echo "ssh-ed25519 AAAA... github-actions-sukrucakmak.com" | sudo tee /home/sukrucakmakcom/.ssh/authorized_keys
sudo chmod 700 /home/sukrucakmakcom/.ssh
sudo chmod 600 /home/sukrucakmakcom/.ssh/authorized_keys
sudo chown -R sukrucakmakcom:sukrucakmakcom /home/sukrucakmakcom/.ssh
# StrictModes: home dizini de group/world-writable OLMAMALI
sudo chmod 755 /home/sukrucakmakcom

# --- Adım 6: site dizinini hazırla, sahipliğini kullanıcıya ver ---
sudo mkdir -p /var/www/sukrucakmak.com
sudo chown sukrucakmakcom:sukrucakmakcom /var/www/sukrucakmak.com
sudo chmod 755 /var/www/sukrucakmak.com
# AlmaLinux SELinux: dizine doğru context'i ver (httpd_sys_content_t)
sudo restorecon -Rv /var/www/sukrucakmak.com
# .ssh dizini için de (ssh_home_t):
sudo restorecon -Rv /home/sukrucakmakcom/.ssh

# --- Adım 7: nginx site config ---
sudo cp deploy/nginx-sukrucakmak.com.conf /etc/nginx/conf.d/sukrucakmak.com.conf
sudo nginx -t && sudo systemctl enable --now nginx

# --- Adım 8: SSL — Cloudflare ile (certbot GEREKMİYOR) ---
# DNS'i Cloudflare'e taşıyıp A kaydını sunucu IP'sine "proxied" (turuncu bulut)
# yap. Sonra iki seçenek:
#
#  a) BASIT ama zayıf: CF panelinde SSL/TLS modunu "Flexible" bırak —
#     nginx :80'de kalır, sertifika gerekmez. (CF<->sunucu trafiği şifresiz gider)
#
#  b) ÖNERİLEN: CF → SSL/TLS → Origin Server → "Create Certificate"
#     ile Origin Certificate üret (ücretsiz, 15 yıl). CRT+KEY'i sunucuya koy:
sudo mkdir -p /etc/nginx/ssl
#     sukrucakmak.com-origin.crt / .key dosyalarını buraya kopyala, sonra:
sudo chmod 600 /etc/nginx/ssl/sukrucakmak.com-origin.key
#     nginx-sukrucakmak.com.conf içindeki :443 bloğunu aç, nginx -t + reload,
#     CF'de SSL modunu "Full (strict)" yap.

# --- Adım 9: SSH ile test (kendi bilgisayarından) ---
ssh -i deploy_key sukrucakmakcom@<SUNUCU_IP> 'ls -la /var/www/sukrucakmak.com'
```

## 3. Deploy

Secrets girildikten sonra `main`'e gelen her merge otomatik deploy eder.
Elle tetiklemek için: Actions → "Deploy to sukrucakmak.com" → Run workflow.

## Sorun giderme — "Permission denied (publickey,...,password)"

Sunucu key'i reddettiğinde sırayla kontrol et:

```bash
# Gerçek nedeni log'da gör:
sudo journalctl -u sshd -e        # veya /var/log/secure

# Kullanıcı kilitli mi ('!' shadow) → pubkey reddedilir:
sudo passwd -S sukrucakmakcom     # 'L' ise:
sudo usermod -p '*' sukrucakmakcom

# İzin/sahiplik (StrictModes):
sudo ls -ld /home/sukrucakmakcom /home/sukrucakmakcom/.ssh \
  /home/sukrucakmakcom/.ssh/authorized_keys
# home ≤755, .ssh 700, authorized_keys 600, hepsi sukrucakmakcom:sukrucakmakcom

# Pubkey dosyada mı ve doğru mu:
sudo cat /home/sukrucakmakcom/.ssh/authorized_keys   # deploy_key.pub ile karşılaştır

# SELinux AVC denial:
sudo ausearch -m avc -ts recent | grep sshd
sudo restorecon -Rv /home/sukrucakmakcom

# Yerelde key'in teklif edildiğini doğrula:
ssh -vvv -i deploy_key sukrucakmakcom@<SUNUCU_IP> 'echo ok'
```

## Notlar

- Site tamamen statik (Nuxt `generate`) — sunucuda node process çalışmaz.
- `_nuxt/` altındaki hash'li asset'ler 30 gün immutable cache'lenir; HTML/JSON cache'lenmez.
- rsync `--delete` kullanır: `DEPLOY_PATH` dışında dosya varsa silinir — dizini sadece site için kullan.
- `sukrucakmakcom` kullanıcısına sudo VERME — sadece site dizinine yazması yeterli.
