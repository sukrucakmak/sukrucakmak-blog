---
title: "CentOS Üzerinde SFTP Konfigürasyonu"
description: "CentOS'ta sshd_config ile sadece SFTP erişimi olan bir kullanıcı ve yükleme dizini ayarlamak."
date: 2021-06-20
tags: [application servers]
translation: /en/blog/sftp-configuration-on-centos
---

CentOS üzerinde SFTP konfigürasyonu için bir cheat sheet. Uzun hali [DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-enable-sftp-without-shell-access-on-centos-7)'da.

## Kullanıcı Oluştur

```
sudo adduser xfiles
sudo passwd xfiles
```

## Dosya Transferi İçin Dizin Oluştur

```
sudo mkdir -p /var/sftp/uploads
sudo chown root:root /var/sftp
sudo chmod 755 /var/sftp
sudo chown xfiles:xfiles /var/sftp/uploads
```

## SSH Daemon'u Ayarla

```
sudo vi /etc/ssh/sshd_config

Match User xfiles
ForceCommand internal-sftp
PasswordAuthentication yes
ChrootDirectory /var/sftp
PermitTunnel no
AllowAgentForwarding no
AllowTcpForwarding no
X11Forwarding no
```

## SSH Daemon'u Yeniden Başlat

```
sudo systemctl restart sshd
```

## Sunucuda Test Et

```
sftp xfiles@localhost
```

## Tamamdır!
