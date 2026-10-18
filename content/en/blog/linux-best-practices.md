---
title: "Linux Best Practices"
description: "Frequently used Linux system commands and good practices: CPU, memory, disk, user, and port management."
date: 2022-10-31
tags: [linux]
translation: /blog/linux-best-practices
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

| Command | Description |
|---|---|
| `cd /path/to/you/want/to/go` | Changes to the directory you want |
| `cd -` | Changes to the directory you were in before |
