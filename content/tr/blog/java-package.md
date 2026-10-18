---
title: "Java Package"
description: Java'da package kavramı: sınıfları düzenleme, isim çakışmalarını önleme ve erişim kontrolü.
date: 2011-08-01
tags: [java]
---

Java Package (paket) kavramı Java sınıflarını düzenli tertipli biçimde biraraya getirmek, organize etmek için kullanılır. Aynı kategorideki ya da benzer görevdeki sınıflar biraraya getirilerek mantıksal bir bütünlük sağlanır. Bilgisayarınızdaki klasörler gibi düşünebilirsiniz; müziklerim şurada olsun, resimlerimi şuraya koyayım gibi…

- “package” bir Java sınıfına ait eşsiz bir ad uzayı oluşturur. Örnek olarak **String**sınıfı **java.lang** paketi altında tektir, bulunduğu paket de tektir.

- Aynı paketteki sınıflar birbirlerinin “package-access members” yani paket seviyesinde erişim üyeleri olurlar. Bu kavram şu an havada kalabilir, başka bir yazıda “erişim” üzerine detaylı inceleme yaparız, orada daha iyi anlaşılır.

**İsimlendirme Standartı**

Çoğu yazılım standartı gibi, bu da zorunlu olmayan ama bu şekil kullanılırsa insanların daha rahat anlayabilecekleri ve anlaşabilecekleri bir düzen olarak karşımıza çıkmaktadır. Örnek olarak ben şu an **[i2i systems](http://www.i2i-systems.com)** isimli şirkette çalışıyorum ve “EasyProv” adında ticari (commercial) bir uygulama yazıyorum, uygulama üzerindeki sık kullandığım araçları (utilities) bir paket altında toplamak istiyorum;

[java]

package com.i2i.easyprov.util;

[/java]

Tekrar okursak şu bilgileri ediniyoruz;

1. **com** – Ticari bir paket

2. **i2i** – i2i şirketi yazmış

3. **easyprov** – easyprov projesine ait

4. **util** – util (utilities) yani araçlar burada bulunuyor

Kısacası bu paket altında neler bulabileceğim önceden görünüyor 🙂
**Java Temel Paketlerinden bazıları…**

- [java.lang](http://download.oracle.com/javase/6/docs/api/java/lang/package-summary.html) 	— dilin işlevselliği ve temel tiplerin bulunduğu paket, String, Integer gibi…

- [java.util](http://download.oracle.com/javase/6/docs/api/java/util/package-summary.html)	— collection veri yapılarının sınıfları

- [java.io](http://download.oracle.com/javase/6/docs/api/java/io/package-summary.html) 	— dosya işlemleri

- [java.math](http://download.oracle.com/javase/6/docs/api//java/math/package-summary.html) 	— matematiksel işlemler

- [java.net](http://download.oracle.com/javase/6/docs/api/java/net/package-summary.html) 	— ağ operasyonları, socket programlama vb…

- [java.security](http://download.oracle.com/javase/6/docs/api/java/security/package-summary.html) 	— anahtar üretme, şifreleme, çözümleme…

- [java.sql](http://download.oracle.com/javase/6/docs/api/java/sql/package-summary.html) 	—veritabanlarına erişim için Java Database Connectivity (JDBC)

- [java.awt](http://download.oracle.com/javase/6/docs/api/java/awt/package-summary.html) 	— masaüstü uygulamaları için görsel arayüz bileşen paketi

- [javax.swing](http://download.oracle.com/javase/6/docs/api/javax/swing/package-summary.html) 	— awt gibi ama platform bağımsız arayüz bileşen paketi

- [java.applet](http://download.oracle.com/javase/6/docs/api/java/applet/package-summary.html) 	— applet geliştirmek için kullanılan sınıfların bulunduğu paket

Umarım faydalı olmuştur 🙂 en sevmediğiniz paket “default package” olsun.

Kolay gelsin.
**Kaynaklar**

1. http://download.oracle.com/javase/tutorial/java/concepts/package.html

2. http://en.wikipedia.org/wiki/Java_package
