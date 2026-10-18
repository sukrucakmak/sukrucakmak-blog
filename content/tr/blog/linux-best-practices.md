---
title: "Linux Best Practices"
description: "Linux'ta sık kullanılan sistem komutları ve iyi pratikler: CPU, bellek, disk, kullanıcı ve port yönetimi."
date: 2022-10-31
tags: [linux]
translation: /en/blog/linux-best-practices
---

**CPU**

```bash
lscpu
cat /proc/cpuinfo
```

**Memory Usage**

```bash
free
cat /proc/meminfo
top
htop
```

**Disk Usage**

```bash
df -h
du -h
```

**OS Check**

```bash
cat /etc/os-release
cat /etc/system-release
lsb_release -a
sw_vers
```

**Users**

```bash
w
who
users
cat /etc/passwd
```

**Groups**

```bash
cat /etc/group
```

**Change Password**

```bash
passwd
```

**Port Check**

```bash
netstat -ant
```

**Change Directory**

| Komut | Açıklama |
|---|---|
| `cd /path/to/you/want/to/go` | İstediğin dizine geçer |
| `cd -` | Eski çalıştığın dizine geçer |
