---
title: "CentOS 7 Üzerine MySQL Kurmak"
description: CentOS 7 üzerine yum ile MySQL kurulumu ve ilk yapılandırma adımları.
date: 2017-09-27
tags: [database management systems, mysql]
---

CentOS package manager olarak yum kullanıyor. O sebeple önce bunu güncellememiz lazım. Aşağıdaki komutla yapabiliriz.

[shell]sudo yum update[/shell]

Güncelleme bittikten sonra indireceğimiz mysql server versiyonunu belirlememiz lazım. Mysql download sayfasından ([http://dev.mysql.com/downloads/repo/yum/](http://dev.mysql.com/downloads/repo/yum/)) versiyonumuzu seçelim.
Ben versiyon olarak bu örnekte aşağıdaki versiyonu seçtim.

https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
Şimdi sırasıyla bu versiyonu indirelim.

[shell]sudo rpm -Uvh https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm[/shell]
İndirme işlemi bitince kurulumu başlatalım.

[shell]sudo yum install mysql-community-server[/shell]
Kurulum da bitince MySQL Community Server’ı başlatabiliriz.

[shell]sudo service mysqld start[/shell]
Sunucunun durumuna aşağıdaki komut ile bakabiliriz.

[shell]sudo service mysqld status[/shell]
Active(running) şeklinde görebildiysek başarılıyız.
Şimdi aklımızda sorular olması lazım 🙂 Kurdum ama şifrem ne, hangi porttan erişebilirim gibi…

Öncelikle şifremizi belirleyelim. Kurulum aşamasında bize rastgele bir şifre verildi, onu önce bi alalım.

[shell]sudo grep ‘temporary password’ /var/log/mysqld.log[/shell]
Süper artık random password elimizde. O zaman değiştirelim, bunun için MySQL Server’a bağlanmamız lazım.

[shell]mysql -uroot -p[/shell]
MySQL konsoluna düşmemiz lazım. “mysql>” şeklinde görebiliriz. Şifreyi değiştirelim.

[shell]ALTER USER ‘root’@’localhost’ IDENTIFIED BY ‘YeniSifrem123!’;[/shell]
Portu da kontrol edip yazımızı bitirelim.

[shell]select @@port;[/shell]
Bu arada mysql konsolundan çıkmak için “exit;” yazıp entera basın, kalmayın orada 🙂
