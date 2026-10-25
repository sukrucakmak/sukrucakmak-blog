---
title: "Linux Ağ ve Sorun Giderme Komutları: curl, ss, dig, tcpdump"
description: "Bir servise neden ulaşılamadığını adım adım bulmak — ip, ping, dig, curl, ss, traceroute/mtr, nc, tcpdump ve firewall komutları."
date: 2026-11-04
tags: [linux, network, devops, rehber]
translation: /en/blog/linux-network-troubleshooting
---

## Giriş

"Servise erişilemiyor" şikâyetinin arkasında onlarca sebep olabilir: DNS yanlış çözülüyor, port dinlenmiyor, firewall engelliyor, sertifika geçersiz ya da uygulama sadece `localhost`'ta dinliyor. Doğru komutlarla bunların hangisi olduğunu birkaç dakikada bulmak mümkün.

Bu yazı, sorunu katman katman daraltmak için kullanılan komutları sırasıyla topluyor: arayüz → DNS → bağlantı → port → uygulama → paket.

## 1. Arayüzler, IP ve route

```bash
ip a                         # arayüzler ve IP adresleri (ip addr)
ip -br a                     # kısa özet
ip r                         # route tablosu; "default via" → gateway
ip r get 8.8.8.8             # bu hedefe hangi arayüz/gateway ile gidilir
ip link set eth0 up
hostname -I                  # sunucunun IP'leri
curl -s ifconfig.me          # dışarıdan görünen public IP
```

`ifconfig`, `netstat` ve `route` komutları `net-tools` paketiyle gelir ve çoğu dağıtımda artık varsayılan olarak kurulu değildir; yerlerini `ip` ve `ss` aldı.

## 2. Erişilebilirlik: ping, traceroute, mtr

```bash
ping -c 4 example.com        # 4 paket gönder
ping -c 4 -W 2 10.0.1.15     # 2 sn zaman aşımı
traceroute example.com       # paketin geçtiği router'lar
tracepath example.com        # root gerektirmeyen alternatif
mtr -rwc 50 example.com      # ping + traceroute, her hop için kayıp/gecikme raporu
```

> `ping` cevap vermiyor diye sunucu kapalı değildir. Birçok bulut sağlayıcı ve firewall ICMP'yi engeller; bir sonraki adımda TCP portunu doğrudan test edin.

## 3. DNS: dig, nslookup, getent

```bash
dig example.com              # A kaydı, TTL, yanıt veren sunucu
dig +short example.com
dig example.com AAAA         # IPv6
dig example.com MX
dig example.com TXT          # SPF, doğrulama kayıtları
dig @8.8.8.8 example.com     # belirli bir DNS sunucusuna sor
dig +trace example.com       # kökten itibaren çözümleme zinciri
dig -x 203.0.113.10          # ters (PTR) sorgu
nslookup example.com
getent hosts example.com     # sistemin gerçekte kullandığı sonuç (/etc/hosts dahil)
resolvectl status            # systemd-resolved kullanan sistemlerde DNS sunucuları
cat /etc/resolv.conf
```

`dig` doğrudan DNS'e sorar; `getent hosts` ise `/etc/hosts` dahil uygulamaların gördüğü sonucu verir. İkisi farklıysa sorun genelde `/etc/hosts` ya da lokal cache'tedir.

DNS kaydını yeni değiştirdiyseniz eski değer TTL süresi dolana kadar cache'lerde kalabilir; `dig` çıktısındaki TTL kalan süreyi gösterir.

## 4. HTTP: curl

```bash
curl https://api.example.com/health
curl -I https://example.com                 # sadece başlıklar
curl -v https://example.com                 # DNS, TCP, TLS el sıkışması, başlıklar
curl -L http://example.com                  # yönlendirmeleri takip et
curl -sS -o /dev/null -w "%{http_code}\n" https://example.com
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Şükrü"}'
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/me
curl --max-time 5 https://example.com
curl -k https://self-signed.local           # sertifika doğrulamasını atla (sadece test)
curl --resolve example.com:443:203.0.113.10 https://example.com   # DNS'i atlayıp belirli IP'ye git
```

Yanıtın nerede yavaşladığını görmek için zamanlama çıktısı:

```bash
curl -sS -o /dev/null -w "dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\n" https://example.com
```

`--resolve`, DNS'i değiştirmeden önce yeni sunucuyu test etmek ya da load balancer arkasındaki tek bir node'u denemek için çok kullanışlıdır.

## 5. Port ve bağlantılar: ss, lsof

```bash
ss -tlnp                     # dinleyen TCP portları ve süreçler
ss -ulnp                     # dinleyen UDP portları
ss -tnp                      # kurulu TCP bağlantıları
ss -tn state established '( dport = :5432 )'   # PostgreSQL'e giden bağlantılar
ss -s                        # özet istatistik
sudo lsof -i :8080           # 8080'i kullanan süreç
sudo fuser -k 8080/tcp       # 8080'i kullanan süreci öldür
```

| `ss` parametresi | Anlamı |
| --- | --- |
| `-t` / `-u` | TCP / UDP |
| `-l` | Sadece dinleyenler |
| `-n` | İsim çözümlemesi yapma (port numarası göster) |
| `-p` | Süreci göster (başkasının süreçleri için sudo) |

`ss -tlnp` çıktısında **Local Address** sütununa dikkat edin: `127.0.0.1:8080` sadece sunucunun kendisinden erişilebilir, `0.0.0.0:8080` ya da `*:8080` tüm arayüzlerden. "Lokalde çalışıyor, dışarıdan erişilemiyor" sorununun en yaygın sebebi budur.

## 6. TCP portunu test etmek: nc

```bash
nc -zv db.example.com 5432           # port açık mı?
nc -zv 10.0.1.15 20-25               # port aralığı
timeout 3 bash -c '</dev/tcp/10.0.1.15/6379' && echo açık || echo kapalı   # nc yoksa
openssl s_client -connect example.com:443 -servername example.com </dev/null   # TLS ve sertifika zinciri
```

Sonuçları yorumlamak:

| Sonuç | Anlamı |
| --- | --- |
| `succeeded` / `open` | Port açık, bir süreç dinliyor |
| `Connection refused` | Hosta ulaşıldı ama o portta dinleyen yok |
| Zaman aşımı | Arada bir firewall paketi sessizce düşürüyor ya da host erişilemez |

## 7. Paket yakalama: tcpdump

Diğer her şey makul görünüyorsa ama sorun devam ediyorsa, kabloda gerçekte ne olduğuna bakın:

```bash
sudo tcpdump -i any port 8080                     # 8080 trafiği
sudo tcpdump -i eth0 host 10.0.1.15               # belirli host
sudo tcpdump -i any -nn 'tcp port 443 and host 203.0.113.10'
sudo tcpdump -i any -nn port 53                   # DNS sorguları
sudo tcpdump -i any -A -s 0 port 80               # HTTP içeriğini ASCII göster
sudo tcpdump -i any -w capture.pcap port 5432     # Wireshark için dosyaya yaz
sudo tcpdump -r capture.pcap
```

`-nn` IP ve port adlarını çözümlemez, çıktı hem daha hızlı hem daha okunur olur. İstemciden giden `SYN` paketlerini görüp sunucudan yanıt (`SYN-ACK`) gelmiyorsa, sorun arada bir firewall ya da security group'tadır.

## 8. Firewall

```bash
# firewalld (AlmaLinux / RHEL)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# ufw (Ubuntu)
sudo ufw status verbose
sudo ufw allow 8080/tcp

# Doğrudan nftables / iptables
sudo nft list ruleset
sudo iptables -L -n -v
```

Bulut sunucularda işletim sistemi firewall'una ek olarak sağlayıcının **security group / cloud firewall** kurallarını da kontrol etmeyi unutmayın.

## 9. Adım adım kontrol listesi

`https://api.example.com`'a erişilemiyor:

```bash
dig +short api.example.com                      # 1. DNS doğru IP'yi veriyor mu?
nc -zv api.example.com 443                      # 2. Port dışarıdan açık mı?
curl -v https://api.example.com/health          # 3. TLS ve HTTP yanıtı ne?
# Sunucuda:
ss -tlnp | grep -E ':443|:8080'                 # 4. Nginx ve uygulama dinliyor mu, hangi adreste?
curl -s localhost:8080/health                   # 5. Uygulama lokalde yanıt veriyor mu?
sudo firewall-cmd --list-all                    # 6. Firewall izin veriyor mu?
sudo tail -n 50 /var/log/nginx/error.log        # 7. Proxy ne diyor?
journalctl -u myapp -n 100                      # 8. Uygulama ne diyor?
```

| Belirti | Muhtemel sebep |
| --- | --- |
| `Could not resolve host` | DNS kaydı yok ya da yanlış; `dig` ile kontrol |
| `Connection refused` | Servis çalışmıyor ya da yanlış port |
| Zaman aşımı | Firewall / security group engelliyor |
| Lokalde çalışıyor, dışarıdan çalışmıyor | Uygulama `127.0.0.1`'e bind olmuş |
| `SSL certificate problem` | Sertifika süresi dolmuş, zincir eksik ya da domain uyuşmuyor |
| `502` / `504` | Reverse proxy arkadaki uygulamaya ulaşamıyor ya da yanıt geç geliyor |

## Sonuç

Ağ sorunlarının neredeyse tamamı bu yazıdaki on kadar komutla teşhis edilebilir. Önemli olan sırayı korumak: önce DNS (`dig`), sonra port (`nc`, `ss`), sonra uygulama (`curl -v`), en son paketler (`tcpdump`). Her adım bir sonraki adımda bakılacak yeri daraltır ve "her şeyi deneme" yerine sorunu birkaç dakikada izole etmenizi sağlar.
