---
title: "Linux Best Practices"
description: "Frequently used Linux system commands and good practices: CPU, memory, disk, user, and port management."
date: 2022-10-31
tags: [linux]
translation: /blog/linux-best-practices
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

| cd /path/to/you/want/to/go | Changes to the directory you want |
|---|---|
| cd - | Changes to the directory you were in before |
