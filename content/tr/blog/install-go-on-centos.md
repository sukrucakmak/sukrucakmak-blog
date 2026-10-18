---
title: "CentOS Üzerine Go Kurmak"
description: "CentOS üzerine Go kurulumu: indirme, /usr/local altına açma ve PATH ayarı."
date: 2022-10-31
tags: [application servers]
translation: /en/blog/install-go-on-centos
---

## Versiyonu Kontrol Et

```
go version
```

## İndir ve Arşivi Aç

```
wget https://go.dev/dl/go1.18.5.linux-amd64.tar.gz

tar -C /usr/local -zxvf go1.18.5.linux-amd64.tar.gz
```

## Ortam Değişkenine Ekle ve Etkinleştir

```
vi /etc/profile

export PATH=$PATH:/usr/local/go/bin

source /etc/profile
```
