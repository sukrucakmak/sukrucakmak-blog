---
title: "Installing MySQL on CentOS 7"
description: "Installing MySQL on CentOS 7 with yum and the initial configuration steps."
date: 2017-09-27
tags: [database management systems, mysql]
translation: /blog/install-mysql-on-centos-7
---

CentOS uses yum as its package manager, so we need to update it first. We can do that with the command below.

```bash
sudo yum update
```

Once the update finishes we need to pick the MySQL server version we want to download. Let's select our version from the MySQL download page ([http://dev.mysql.com/downloads/repo/yum/](http://dev.mysql.com/downloads/repo/yum/)).
In this example I picked the following version.

https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
Now let's download that version.

```bash
sudo rpm -Uvh https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
```
Once the download finishes, let's start the installation.

```bash
sudo yum install mysql-community-server
```
When the installation is done we can start MySQL Community Server.

```bash
sudo service mysqld start
```
We can check the server status with the following command.

```bash
sudo service mysqld status
```
If we see Active (running), we're successful.
Now we should have questions in mind 🙂 I installed it, but what's my password, which port can I reach it on, etc.…

First let's set our password. A random password was generated during installation — let's grab it first.

```bash
sudo grep ‘temporary password’ /var/log/mysqld.log
```
Great, we now have the random password. Let's change it — for that we need to connect to MySQL Server.

```bash
mysql -uroot -p
```
We should land on the MySQL console — you'll see it as "mysql>". Let's change the password.

```bash
ALTER USER ‘root’@’localhost’ IDENTIFIED BY ‘YeniSifrem123!’;
```
Let's check the port too and finish up.

```bash
select @@port;
```
By the way, to exit the MySQL console type "exit;" and hit Enter — don't linger there 🙂
