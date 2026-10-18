---
title: "CentOS 7 Üzerine MySQL Kurmak"
description: "CentOS 7 üzerine yum ile MySQL kurulumu ve ilk yapılandırma adımları."
date: 2017-09-27
tags: [database management systems, mysql]
translation: /en/blog/install-mysql-on-centos-7
---

CentOS package manager olarak yum kullanıyor. O sebeple önce bunu güncellememiz lazım. Aşağıdaki komutla yapabiliriz.

```bash
sudo yum update
```

Güncelleme bittikten sonra indireceğimiz mysql server versiyonunu belirlememiz lazım. Mysql download sayfasından ([http://dev.mysql.com/downloads/repo/yum/](http://dev.mysql.com/downloads/repo/yum/)) versiyonumuzu seçelim.
Ben versiyon olarak bu örnekte aşağıdaki versiyonu seçtim.

https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
Şimdi sırasıyla bu versiyonu indirelim.

```bash
sudo rpm -Uvh https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
```
İndirme işlemi bitince kurulumu başlatalım.

```bash
sudo yum install mysql-community-server
```
Kurulum da bitince MySQL Community Server’ı başlatabiliriz.

```bash
sudo service mysqld start
```
Sunucunun durumuna aşağıdaki komut ile bakabiliriz.

```bash
sudo service mysqld status
```
Active(running) şeklinde görebildiysek başarılıyız.
Şimdi aklımızda sorular olması lazım 🙂 Kurdum ama şifrem ne, hangi porttan erişebilirim gibi…

Öncelikle şifremizi belirleyelim. Kurulum aşamasında bize rastgele bir şifre verildi, onu önce bi alalım.

```bash
sudo grep ‘temporary password’ /var/log/mysqld.log
```
Süper artık random password elimizde. O zaman değiştirelim, bunun için MySQL Server’a bağlanmamız lazım.

```bash
mysql -uroot -p
```
MySQL konsoluna düşmemiz lazım. “mysql>” şeklinde görebiliriz. Şifreyi değiştirelim.

```bash
ALTER USER ‘root’@’localhost’ IDENTIFIED BY ‘YeniSifrem123!’;
```
Portu da kontrol edip yazımızı bitirelim.

```bash
select @@port;
```
Bu arada mysql konsolundan çıkmak için “exit;” yazıp entera basın, kalmayın orada 🙂
