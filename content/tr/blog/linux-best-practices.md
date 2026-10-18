---
title: "Linux Best Practices"
description: "Linux'ta sık kullanılan sistem komutları ve iyi pratikler: CPU, bellek, disk, kullanıcı ve port yönetimi."
date: 2022-10-31
tags: [linux]
translation: /en/blog/linux-best-practices
---

**CPU**
`lscpu`
`cat /proc/cpuinfo`
**Memory Usage**
`free`
`cat /proc/meminfo`
`top`
`htop`
**Disk Usage**
`df -h`
`du -h`
**OS Check**
`cat /etc/os-release`
`cat /etc/system-release`
`lsb_release -a`
`sw_vers`
**Users**

```
w, who, users
cat /etc/passwd
```

**Groups**
`cat /etc/group`

**Change Password**
`passwd`
**Port Check**
`netstat -ant`
**Change Directory**

| cd /path/to/you/want/to/go | İstediğin dizine geçer |
|---|---|
| cd - | Eski çalıştığın dizine geçer |
