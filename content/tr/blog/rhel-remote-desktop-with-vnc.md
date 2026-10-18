---
title: "VNC ile RHEL Uzak Masaüstü"
description: VNC ile RHEL sunucuya uzak masaüstü bağlantısı kurma adımları.
date: 2019-11-08
tags: [linux]
---

1. Önce bir desktop uygulaması yüklememiz lazım.
  `yum groupinstall "GNOME Desktop"`

2. TigerVNC sunucusunu fontlarıyla birlikte yüklemeliyiz.
  `yum install tigervnc-server xorg-x11-fonts-Type1`

3. 5903 portundan yayın yapabilmesi için bir service oluşturalım.
  `cp /lib/systemd/system/vncserver@.service /etc/systemd/system/vncserver@:3.service`

4. Kullanıcı bilgisini tüm <USER> alanlarını değiştirerek güncelleyelim.
  `vi /etc/systemd/system/vncserver@:3.service`

5. İlgili kullanıcıya geçiş yapıp vncserver için kullanıcı ve şifre oluşturalım.
  `vncserver`

6. Aşağıdaki komutlarla da deamonu enable edip başlatalım
  ```
  systemctl daemon-reload
  systemctl start vncserver@:3.service
  systemctl enable vncserver@:3.service
  ```

Artık VNC viewer ile bağlanabiliriz 🙂
