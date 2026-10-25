---
title: SSH Config, Anahtar Yönetimi ve Tünelleme
description: "ed25519 anahtar üretmek, ssh-agent, ~/.ssh/config ile kısayollar, jump host, port yönlendirme (-L, -R, -D) ve sunucu tarafı güvenlik ayarları."
date: 2026-10-31
tags: [ssh, linux, güvenlik, rehber]
translation: /en/blog/ssh-config-and-tunneling
---

## Giriş

SSH çoğumuz için `ssh root@1.2.3.4` yazıp şifre girmekten ibarettir. Oysa birkaç dakikalık ayarla hem çok daha güvenli hem de çok daha hızlı bir kullanım mümkün: şifresiz anahtar girişi, `ssh prod` gibi kısayollar, bastion üzerinden tek komutla bağlanma ve uzak veritabanına lokal port üzerinden erişim.

## 1. Anahtar üretmek

```bash
ssh-keygen -t ed25519 -C "sukru@laptop"
# ~/.ssh/id_ed25519      → private key (kimseyle paylaşılmaz)
# ~/.ssh/id_ed25519.pub  → public key (sunuculara eklenir)
```

`ed25519`, RSA'ya göre daha kısa, daha hızlı ve güncel önerilen algoritmadır. Eski sistemler için RSA gerekiyorsa en az 4096 bit kullanın: `ssh-keygen -t rsa -b 4096`.

Anahtara passphrase vermek, dosya çalınsa bile kullanılamamasını sağlar. Sonradan eklemek ya da değiştirmek için:

```bash
ssh-keygen -p -f ~/.ssh/id_ed25519
```

## 2. Public key'i sunucuya eklemek

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@203.0.113.10
```

`ssh-copy-id` yoksa (ör. Windows) aynı işi elle yapabilirsiniz:

```bash
cat ~/.ssh/id_ed25519.pub | ssh deploy@203.0.113.10 \
  "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

## 3. ssh-agent

Passphrase'i her bağlantıda yazmamak için anahtarı agent'a ekleyin:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh-add -l                 # agent'taki anahtarlar
ssh-add -D                 # hepsini çıkar
```

macOS'ta passphrase'i Keychain'de saklamak için `ssh-add --apple-use-keychain ~/.ssh/id_ed25519`.

## 4. ~/.ssh/config ile kısayollar

Her seferinde kullanıcı, IP, port ve anahtar yazmak yerine:

```bash
# ~/.ssh/config
Host prod
    HostName 203.0.113.10
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes

Host staging
    HostName 203.0.113.20
    User deploy

Host github.com
    IdentityFile ~/.ssh/id_ed25519_github

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes
```

Artık `ssh prod`, `scp app.jar prod:/opt/app/` ve `rsync -az dist/ prod:/var/www/` doğrudan çalışır.

- `IdentitiesOnly yes`, agent'taki tüm anahtarları tek tek denemek yerine sadece belirtileni kullanır; "Too many authentication failures" hatasını önler.
- `ServerAliveInterval`, boşta kalan bağlantıların firewall/NAT tarafından koparılmasını engeller.
- Eşleşmede **ilk bulunan değer** geçerlidir; bu yüzden `Host *` bloğunu dosyanın sonuna koyun.

## 5. Jump host (bastion)

Özel ağdaki bir sunucuya sadece bastion üzerinden ulaşılabiliyorsa:

```bash
ssh -J deploy@bastion.example.com deploy@10.0.1.15
```

Config ile kalıcı hale getirmek için:

```bash
Host bastion
    HostName bastion.example.com
    User deploy

Host db-server
    HostName 10.0.1.15
    User deploy
    ProxyJump bastion
```

`ssh db-server` tek adımda iki sunucudan geçerek bağlanır. Private key bastion'a hiç kopyalanmaz.

## 6. Port yönlendirme (tünelleme)

### Lokal yönlendirme (-L)

Uzak sunucudaki, dışarıya kapalı bir servise kendi makinenizden erişmek için. Örneğin sunucuda sadece `localhost:5432`'de dinleyen PostgreSQL:

```bash
ssh -N -L 5433:localhost:5432 prod
# Artık lokalde: psql -h localhost -p 5433 -U app
```

`-N` uzakta komut çalıştırmaz, sadece tüneli açık tutar. Arka plana almak için `-f` ekleyin.

Bastion üzerinden özel ağdaki başka bir sunucuya:

```bash
ssh -N -L 6380:10.0.1.20:6379 bastion    # lokal 6380 → 10.0.1.20:6379 (Redis)
```

### Uzak yönlendirme (-R)

Tersi: kendi makinenizdeki bir servisi uzak sunucu üzerinden erişilebilir yapar.

```bash
ssh -N -R 8080:localhost:3000 prod
# Sunucuda: curl localhost:8080 → sizin makinenizdeki :3000
```

### Dinamik yönlendirme (-D)

Lokal bir SOCKS proxy açar; tarayıcı trafiğini sunucu üzerinden geçirmek için:

```bash
ssh -N -D 1080 prod
curl --socks5-hostname localhost:1080 https://ifconfig.me
```

| Parametre | Yön | Tipik kullanım |
| --- | --- | --- |
| `-L lokal:hedef:port` | Lokal → uzak | Uzak DB'ye/admin paneline erişim |
| `-R uzak:hedef:port` | Uzak → lokal | Lokal servisi geçici olarak dışarı açmak |
| `-D port` | SOCKS proxy | Tüm trafiği sunucu üzerinden çıkarmak |

## 7. Dosya kopyalama

```bash
scp app.jar prod:/opt/app/
scp -r prod:/var/log/myapp ./logs
rsync -avz --progress dist/ prod:/var/www/app/
rsync -avz --delete -e "ssh -p 2222" dist/ deploy@203.0.113.10:/var/www/app/
sftp prod
```

Büyük ya da tekrarlanan transferlerde `rsync` tercih edin: sadece değişen dosyaları gönderir ve yarıda kalan aktarımı sürdürebilir.

## 8. Sunucu tarafı güvenlik

Anahtar girişinin çalıştığını doğruladıktan **sonra** `/etc/ssh/sshd_config` dosyasında:

```bash
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
MaxAuthTries 3
```

```bash
sudo sshd -t                       # yapılandırmayı test et
sudo systemctl reload sshd         # Ubuntu'da servis adı: ssh
```

> Değişikliği uygularken mevcut SSH oturumunu kapatmayın. Yeni bir terminalden bağlanabildiğinizi doğrulayana kadar açık tutun; aksi halde sunucuya erişimi kaybedebilirsiniz.

Brute-force denemelerini azaltmak için `fail2ban` kurmak da iyi bir ek önlemdir.

## 9. Sorun giderme

| Hata | Sebep / Çözüm |
| --- | --- |
| `Permission denied (publickey)` | Public key `authorized_keys`'te yok ya da yanlış kullanıcı; `ssh -v` ile hangi anahtarın denendiğine bakın |
| Anahtar var ama yine şifre soruyor | İzinler yanlış: `~/.ssh` 700, `authorized_keys` 600 olmalı, home dizini başkalarınca yazılabilir olmamalı |
| `UNPROTECTED PRIVATE KEY FILE` | `chmod 600 ~/.ssh/id_ed25519` |
| `Too many authentication failures` | Config'e `IdentitiesOnly yes` ve doğru `IdentityFile` ekleyin |
| `REMOTE HOST IDENTIFICATION HAS CHANGED` | Sunucu yeniden kurulduysa `ssh-keygen -R 203.0.113.10`; değilse dikkat, MITM olabilir |
| Bağlantı boşta kopuyor | `ServerAliveInterval 60` |
| `bind: Address already in use` (tünel) | Lokal port dolu; farklı bir port seçin |

Her türlü bağlantı sorununda ilk adım ayrıntılı çıktıdır: `ssh -v prod` (daha fazlası için `-vvv`).

## Sonuç

Bir ed25519 anahtar, iyi düzenlenmiş bir `~/.ssh/config` ve `-L` ile açılan tüneller, SSH'ı sadece "sunucuya bağlanma aracı" olmaktan çıkarıp günlük işin merkezine taşır. Sunucu tarafında ise şifreli girişi ve root girişini kapatmak, alınabilecek en etkili iki güvenlik önlemidir.
