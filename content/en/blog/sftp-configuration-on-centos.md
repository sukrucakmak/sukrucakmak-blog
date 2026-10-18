---
title: "SFTP Configuration on CentOS"
description: "Configuring an SFTP-only user and upload directory on CentOS via sshd_config."
date: 2021-06-20
tags: [application servers]
translation: /blog/sftp-configuration-on-centos
---

It is a cheat sheet for SFTP configuration on CentOS. Long version is on [DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-enable-sftp-without-shell-access-on-centos-7).

## Create a User

```
sudo adduser xfiles
sudo passwd xfiles
```

## Create a Directory for File Transfers

```
sudo mkdir -p /var/sftp/uploads
sudo chown root:root /var/sftp
sudo chmod 755 /var/sftp
sudo chown xfiles:xfiles /var/sftp/uploads
```

## Configure SSH Deamon

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

## Restart SSD Deamon

```
sudo systemctl restart sshd
```

## Test in the Server

```
sftp xfiles@localhost
```

## Well Done!
