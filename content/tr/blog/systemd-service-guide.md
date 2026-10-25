---
title: systemd ile Linux Servisi Yazmak
description: "Bir uygulamayı systemd servisi olarak çalıştırmak — unit dosyası, restart politikası, ortam değişkenleri, journalctl ile log okuma ve timer ile zamanlanmış görevler."
date: 2026-10-30
tags: [linux, systemd, devops, rehber]
translation: /en/blog/systemd-service-guide
---

## Giriş

Bir Java jar'ını, Node.js uygulamasını ya da bir Python script'ini sunucuda `nohup ... &` ile başlatmak ilk bakışta işe yarar; ama süreç çöktüğünde kimse yeniden başlatmaz, sunucu reboot olduğunda uygulama açılmaz ve loglar dağınık kalır.

Modern Linux dağıtımlarının (Ubuntu, Debian, AlmaLinux, RHEL) tamamında bulunan **systemd**, bu işleri ek bir araç kurmadan çözer: süreci başlatır, çökerse yeniden başlatır, açılışta otomatik çalıştırır ve loglarını `journald`'a toplar.

## 1. Temel systemctl komutları

```bash
sudo systemctl start myapp       # başlat
sudo systemctl stop myapp        # durdur
sudo systemctl restart myapp     # yeniden başlat
sudo systemctl reload myapp      # yapılandırmayı yeniden oku (destekliyorsa)
sudo systemctl enable myapp      # açılışta otomatik başlat
sudo systemctl enable --now myapp    # enable + start
sudo systemctl disable myapp
systemctl status myapp           # durum, PID, son log satırları
systemctl is-active myapp
systemctl list-units --type=service --state=running
systemctl list-units --failed
```

## 2. İlk unit dosyası

Kendi servisleriniz için unit dosyaları `/etc/systemd/system/` altına konur. Örnek olarak bir Spring Boot uygulaması:

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Spring Boot App
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/java -Xmx512m -jar /opt/myapp/app.jar
Restart=on-failure
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
```

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin myapp
sudo systemctl daemon-reload     # yeni/değişen unit dosyasını oku
sudo systemctl enable --now myapp
systemctl status myapp
```

Bölümlerin anlamı:

| Bölüm | Görevi |
| --- | --- |
| `[Unit]` | Açıklama ve diğer unit'lerle ilişki (`After`, `Wants`, `Requires`) |
| `[Service]` | Sürecin nasıl çalışacağı: komut, kullanıcı, restart politikası |
| `[Install]` | `enable` edildiğinde hangi hedefe bağlanacağı; sunucular için `multi-user.target` |

`SuccessExitStatus=143`, Java'nın `SIGTERM` ile kapanırken döndürdüğü 143 kodunun hata sayılmamasını sağlar.

> Unit dosyasını her değiştirdiğinizde `systemctl daemon-reload` çalıştırmayı unutmayın; aksi halde systemd eski hali kullanmaya devam eder.

## 3. Node.js ve Python örnekleri

```ini
# /etc/systemd/system/api.service
[Unit]
Description=Node.js API
After=network.target

[Service]
User=deploy
WorkingDirectory=/var/www/api
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/worker.service
[Unit]
Description=Python worker
After=network.target

[Service]
User=deploy
WorkingDirectory=/opt/worker
ExecStart=/opt/worker/.venv/bin/python worker.py
Restart=on-failure
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

`PYTHONUNBUFFERED=1` olmadan Python çıktıyı tamponlar ve loglar journal'a gecikmeli düşer.

## 4. Ortam değişkenleri ve gizli değerler

Az sayıda değişken için `Environment=` yeterlidir. Çok sayıda değişken ya da şifre içeren değerler için ayrı bir dosya kullanın:

```bash
# /etc/myapp/myapp.env  (chmod 600, sahibi root)
SPRING_PROFILES_ACTIVE=prod
DB_PASSWORD=s3cret
```

```ini
[Service]
EnvironmentFile=/etc/myapp/myapp.env
```

Değişkenlerin servise ulaştığını kontrol etmek için:

```bash
systemctl show myapp --property=Environment
sudo cat /proc/$(systemctl show -p MainPID --value myapp)/environ | tr '\0' '\n'
```

## 5. Restart politikaları

| `Restart=` | Ne zaman yeniden başlatır |
| --- | --- |
| `no` | Hiçbir zaman (varsayılan) |
| `on-failure` | Sıfır dışı çıkış kodu, sinyal, timeout |
| `on-abnormal` | Sinyal ya da timeout (çıkış kodu hariç) |
| `always` | Her çıkışta, temiz çıkış dahil |

Sürekli çöken bir servisin sonsuz döngüye girmesini sınırlamak için:

```ini
[Unit]
StartLimitIntervalSec=60
StartLimitBurst=5
```

60 saniye içinde 5'ten fazla başlatma denemesi olursa systemd servisi `failed` durumuna alır ve denemeyi bırakır. Sayaç `systemctl reset-failed myapp` ile sıfırlanır.

## 6. journalctl ile loglar

Servisin stdout/stderr çıktısı otomatik olarak journal'a yazılır:

```bash
journalctl -u myapp                  # tüm loglar
journalctl -u myapp -f               # canlı takip
journalctl -u myapp -n 200           # son 200 satır
journalctl -u myapp --since "1 hour ago"
journalctl -u myapp --since today
journalctl -u myapp --since "2026-10-30 09:00" --until "2026-10-30 10:00"
journalctl -u myapp -p err           # sadece error ve üstü
journalctl -u myapp -b               # son açılıştan beri
journalctl -u myapp -o cat           # zaman damgası olmadan sade çıktı
journalctl --disk-usage
sudo journalctl --vacuum-time=14d    # 14 günden eski logları sil
```

Journal'ın disk kullanımını kalıcı olarak sınırlamak için `/etc/systemd/journald.conf` içinde `SystemMaxUse=500M` ayarlayıp `sudo systemctl restart systemd-journald` çalıştırın.

## 7. Basit güvenlik sıkılaştırması

systemd, süreci birkaç satırla kısıtlamanıza izin verir:

```ini
[Service]
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/myapp/data /var/log/myapp
```

`ProtectSystem=strict` tüm dosya sistemini salt okunur yapar; uygulamanın yazması gereken klasörleri `ReadWritePaths` ile açarsınız. Servisin ne kadar korunaklı olduğunu görmek için `systemd-analyze security myapp` kullanabilirsiniz.

## 8. Timer ile zamanlanmış görev

systemd timer'ları cron'a alternatiftir; loglar journal'da toplanır ve kaçırılan çalıştırmalar telafi edilebilir. Her gece 02:00'de çalışan bir yedekleme:

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Nightly database backup

[Service]
Type=oneshot
User=postgres
ExecStart=/usr/local/bin/backup.sh
```

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run backup nightly

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers
systemd-analyze calendar "*-*-* 02:00:00"   # ifadenin bir sonraki çalışma zamanı
```

`Persistent=true`, sunucu 02:00'de kapalıysa açıldığında görevin hemen çalışmasını sağlar.

## 9. Sorun giderme

| Durum | Bakılacak yer |
| --- | --- |
| `status=203/EXEC` | `ExecStart` yolu yanlış ya da dosya çalıştırılabilir değil; mutlak yol kullanın |
| `status=217/USER` | `User=` ile belirtilen kullanıcı yok |
| Değişiklik etkisiz | `systemctl daemon-reload` unutuldu |
| Komut terminalde çalışıyor, serviste çalışmıyor | `PATH` ve ortam değişkenleri farklı; `WorkingDirectory` ve `Environment` tanımlayın |
| Servis sürekli yeniden başlıyor | `journalctl -u myapp -n 100` ile hatayı okuyun; `systemctl reset-failed` ile sayacı sıfırlayın |
| Unit dosyası hatalı mı? | `systemd-analyze verify /etc/systemd/system/myapp.service` |

## Sonuç

systemd ile bir servis yazmak, 10-15 satırlık bir unit dosyası demek. Karşılığında otomatik yeniden başlatma, açılışta çalışma, merkezi loglar ve süreç izolasyonu ek hiçbir araç kurmadan gelir. Akılda tutulacak üç komut: değişiklikten sonra `daemon-reload`, durum için `systemctl status`, sebep için `journalctl -u`.
