---
title: "Linux X11Forwarding"
description: "SSH üzerinden X11Forwarding açarak Linux sunucunun grafik ekranını yerel masaüstüne taşımak."
date: 2019-11-05
tags: [application servers]
translation: /en/blog/linux-x11-forwarding
---

Linux sunucu ekranını kendi masaüstümüze çekmek için X11Forwarding açmamız lazım. Aşağıdaki komutlarla açabiliriz.

cat /etc/ssh/sshd_config
vi /etc/ssh/sshd_config

AddressFamily inet
X11Forwarding yes

service sshd restart

touch /home/user/.Xauthority
xauth list
xauth add
