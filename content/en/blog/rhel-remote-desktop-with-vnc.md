---
title: "RHEL Remote Desktop with VNC"
description: "Setting up a VNC remote desktop connection to a RHEL server."
date: 2019-11-08
tags: [linux]
translation: /blog/rhel-remote-desktop-with-vnc
---

1. First we need to install a desktop environment.
  `yum groupinstall "GNOME Desktop"`

2. We need to install the TigerVNC server along with its fonts.
  `yum install tigervnc-server xorg-x11-fonts-Type1`

3. Let's create a service so it can serve on port 5903.
  `cp /lib/systemd/system/vncserver@.service /etc/systemd/system/vncserver@:3.service`

4. Update the user information by replacing every `<USER>` field.
  `vi /etc/systemd/system/vncserver@:3.service`

5. Switch to the relevant user and create a VNC user and password.
  `vncserver`

6. Enable and start the daemon with the commands below.
  ```
  systemctl daemon-reload
  systemctl start vncserver@:3.service
  systemctl enable vncserver@:3.service
  ```

Now we can connect with a VNC viewer 🙂
