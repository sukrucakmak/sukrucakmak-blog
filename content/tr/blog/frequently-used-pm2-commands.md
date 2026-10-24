---
title: Sık Kullanılan PM2 Komutları
description: "Node.js uygulamalarını production'da ayakta tutan PM2'nin en çok kullanılan komutları — başlatma, izleme, loglar, cluster modu, ecosystem dosyası ve sunucu açılışında otomatik başlatma."
date: 2026-10-24
tags: [pm2, nodejs, rehber]
translation: /en/blog/frequently-used-pm2-commands
---

## Giriş

[PM2](https://pm2.keymetrics.io/), Node.js uygulamaları için bir süreç yöneticisidir (process manager). Uygulamanızı arka planda çalıştırır, çökerse yeniden başlatır, logları toplar, birden fazla CPU çekirdeğine dağıtır ve sunucu yeniden başladığında uygulamaları otomatik olarak geri getirir. Sadece Node.js değil; Python, Bash ya da herhangi bir çalıştırılabilir dosyayı da yönetebilir.

Bu yazı günlük işte en çok ihtiyaç duyulan PM2 komutlarını kullanım sırasıyla topluyor. Örneklerde uygulama adı olarak `api` kullanılıyor; komutlarda isim yerine `pm2 list` çıktısındaki **id** numarasını ya da tüm uygulamalar için `all` yazabilirsiniz.

## 1. Kurulum

PM2 global olarak kurulur:

```bash
npm install -g pm2
pm2 --version
```

PM2'yi güncelledikten sonra arka plandaki daemon'ın da yeni sürüme geçmesi için `pm2 update` çalıştırın; çalışan uygulamalar kaydedilip yeniden ayağa kaldırılır.

```bash
npm install -g pm2@latest
pm2 update
```

## 2. Uygulama başlatma

```bash
pm2 start app.js                       # en basit hali
pm2 start app.js --name api            # anlamlı bir isim ver
pm2 start app.js --watch               # dosya değişince yeniden başlat (geliştirme için)
pm2 start app.js --max-memory-restart 300M   # bellek sınırı aşılırsa yeniden başlat
pm2 start app.js --cron-restart="0 3 * * *"  # her gece 03:00'te yeniden başlat
pm2 start app.js --node-args="--max-old-space-size=4096"
pm2 start app.js -- --port 8080        # "--" sonrası uygulamaya argüman olarak geçer
```

npm script'i, başka bir dil ya da hazır bir komut da çalıştırabilirsiniz:

```bash
pm2 start npm --name web -- start          # "npm start" çalıştırır
pm2 start "npm run start" --name web       # aynısı, tırnak içinde komut
pm2 start worker.py --interpreter python3  # Python script
pm2 start backup.sh --no-autorestart       # bir kere çalışıp bitsin
```

## 3. Listeleme ve izleme

```bash
pm2 list               # tüm süreçler (kısaltmaları: pm2 ls, pm2 status)
pm2 show api           # tek süreç detayı: log yolları, restart sayısı, env, uptime
pm2 monit              # terminalde canlı CPU/bellek ve log paneli
pm2 jlist              # listeyi JSON olarak ver (script'ler için)
```

`pm2 list` çıktısında **↺** sütunu restart sayısını gösterir. Bu sayı sürekli artıyorsa uygulama çöküp yeniden başlıyordur; sebebi için loglara bakın.

## 4. Durdurma, yeniden başlatma, silme

```bash
pm2 stop api           # durdur (listede kalır)
pm2 restart api        # durdur + başlat
pm2 reload api         # kesintisiz yeniden yükle (cluster modunda)
pm2 delete api         # durdur ve listeden kaldır

pm2 restart all
pm2 stop all
pm2 delete all
```

| Komut | Ne yapar | Ne zaman |
| --- | --- | --- |
| `restart` | Süreci öldürüp yeniden başlatır, kısa bir kesinti olur | Fork modu, config değişikliği |
| `reload` | Instance'ları tek tek yeniler, en az biri hep ayakta kalır | Cluster modunda deploy sonrası |
| `stop` | Süreci durdurur, ayarları listede tutar | Geçici olarak kapatmak |
| `delete` | Süreci durdurup listeden tamamen siler | Uygulamayı kaldırmak |

## 5. Loglar

PM2 her uygulamanın `stdout` ve `stderr` çıktısını varsayılan olarak `~/.pm2/logs/` altına yazar.

```bash
pm2 logs               # tüm uygulamaların canlı logları
pm2 logs api           # sadece api
pm2 logs api --lines 200   # son 200 satır, sonra canlı akış
pm2 logs api --err     # sadece hata çıktısı
pm2 logs --nostream    # son satırları yaz ve çık
pm2 flush              # tüm log dosyalarını boşalt
pm2 flush api          # sadece api'nin loglarını boşalt
```

Loglar zamanla diski doldurabilir; `pm2-logrotate` modülü dosyaları boyuta göre döndürür ve eski dosyaları siler:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M     # dosya 10 MB olunca döndür
pm2 set pm2-logrotate:retain 7         # son 7 dosyayı sakla
pm2 set pm2-logrotate:compress true    # eski dosyaları gzip'le
```

## 6. Cluster modu ve ölçekleme

Node.js tek çekirdekte çalışır. Cluster modu, uygulamanın birden fazla kopyasını aynı port üzerinden çalıştırıp yükü çekirdeklere dağıtır — kodda değişiklik gerekmez.

```bash
pm2 start app.js -i max --name api     # çekirdek sayısı kadar instance
pm2 start app.js -i 4 --name api       # 4 instance
pm2 scale api 2                        # instance sayısını 2'ye ayarla
pm2 scale api +2                       # 2 instance daha ekle
pm2 reload api                         # sıfır kesintiyle yenile
```

> Cluster modu uygulamanın **stateless** olmasını gerektirir: oturum, cache gibi verileri bellekte değil Redis ya da veritabanında tutun.

## 7. Ecosystem dosyası

Komut satırı parametreleri çoğaldıkça hepsini bir yapılandırma dosyasında toplamak daha düzenlidir. Örnek dosya oluşturmak için:

```bash
pm2 init simple        # ecosystem.config.js oluşturur
```

```js
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
    },
    {
      name: 'worker',
      script: './dist/worker.js',
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js                      # tüm uygulamaları başlat (env)
pm2 start ecosystem.config.js --env production     # env_production değişkenleriyle
pm2 start ecosystem.config.js --only api           # sadece api
pm2 reload ecosystem.config.js --env production    # deploy sonrası kesintisiz yenile
```

Bu dosyayı projeyle birlikte Git'e eklerseniz uygulamanın nasıl çalıştırılacağı da kodla birlikte versiyonlanmış olur.

## 8. Ortam değişkenleri

PM2, uygulama ilk başlatıldığındaki ortam değişkenlerini saklar. Bir değişkeni değiştirdikten sonra yalnızca `restart` yetmez; `--update-env` eklemelisiniz:

```bash
NODE_ENV=production pm2 restart api --update-env
pm2 env 0              # 0 id'li sürecin ortam değişkenlerini göster
```

## 9. Sunucu açılışında otomatik başlatma

Sunucu yeniden başladığında uygulamaların geri gelmesi için iki adım gerekir:

```bash
pm2 startup            # init sistemini (systemd vb.) algılar ve çalıştırılacak sudo komutunu yazar
# ekrana basılan "sudo env PATH=... pm2 startup systemd -u kullanici --hp /home/kullanici" komutunu çalıştırın

pm2 save               # o an çalışan süreç listesini ~/.pm2/dump.pm2 dosyasına kaydet
```

Açılışta PM2 bu kayıtlı listeyi geri yükler. Yeni uygulama ekleyip sildikten sonra `pm2 save` komutunu tekrar çalıştırmayı unutmayın.

```bash
pm2 resurrect          # kaydedilmiş listeyi elle geri yükle
pm2 unstartup systemd  # otomatik başlatmayı kaldır
```

> Node.js'i nvm ile kurduysanız ve sürüm değiştirdiyseniz `pm2 unstartup` + `pm2 startup` adımlarını tekrarlayın; startup betiği eski Node yolunu tutuyor olabilir.

## 10. Bakım ve sorun giderme

```bash
pm2 reset api          # restart sayacı gibi metrikleri sıfırla
pm2 describe api       # pm2 show ile aynı
pm2 ping               # daemon ayakta mı?
pm2 kill               # daemon'ı ve tüm süreçleri durdur
```

Sık karşılaşılan durumlar:

| Durum | Çözüm |
| --- | --- |
| Uygulama sürekli yeniden başlıyor (↺ artıyor) | `pm2 logs api --err --lines 100` ile hatayı bulun |
| Yeni env değişkeni uygulamaya geçmiyor | `pm2 restart api --update-env` |
| Sunucu reboot sonrası uygulamalar yok | `pm2 startup` çıktısındaki komutu çalıştırıp `pm2 save` |
| Disk loglarla doldu | `pm2 flush` + `pm2-logrotate` kurun |
| PM2 güncellemesinden sonra "In-memory PM2 is out-of-date" uyarısı | `pm2 update` |

## Sonuç

PM2 ile günlük işin büyük kısmı `start`, `list`, `logs`, `restart`/`reload` ve `save` komutlarıyla döner. Production'a çıkarken üç şeyi unutmayın: ayarları bir **ecosystem dosyasında** toplayın, **`pm2 startup` + `pm2 save`** ile açılışta otomatik başlatmayı kurun ve **`pm2-logrotate`** ile logların diski doldurmasını engelleyin.
