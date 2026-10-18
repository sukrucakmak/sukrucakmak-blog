---
title: "Install Go on CentOS"
description: Installing Go on CentOS: download, extract to /usr/local, and PATH configuration.
date: 2022-10-31
tags: [application servers]
---

## Check Version

```
go version
```

## Download and Unzip

```
wget https://go.dev/dl/go1.18.5.linux-amd64.tar.gz

tar -C /usr/local -zxvf go1.18.5.linux-amd64.tar.gz
```

## Add to Environment Variable and Take Effect

```
vi /etc/profile

export PATH=$PATH:/usr/local/go/bin

source /etc/profile
```
