---
title: "Linux X11Forwarding"
description: "Enabling X11Forwarding over SSH to bring a Linux server's graphical display to your local desktop."
date: 2019-11-05
tags: [application servers]
translation: /blog/linux-x11-forwarding
---

To pull the display of a Linux server onto our own desktop we need to enable X11Forwarding. We can do that with the commands below.

cat /etc/ssh/sshd_config
vi /etc/ssh/sshd_config

AddressFamily inet
X11Forwarding yes

service sshd restart

touch /home/user/.Xauthority
xauth list
xauth add
