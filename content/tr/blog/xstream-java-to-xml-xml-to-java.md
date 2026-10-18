---
title: "XStream – Java to XML, XML to Java"
description: "XStream kütüphanesiyle Java nesnelerini XML'e ve XML'i tekrar nesneye dönüştürme."
date: 2011-06-15
tags: [java, xml]
translation: /en/blog/xstream-java-to-xml-xml-to-java
---

[![](/images/xstream-java-to-xml-xml-to-java-xstream_logo-300x98.gif)](https://www.sukrucakmak.com/wp-content/uploads/2011/06/xstream_logo.gif)

Java nesnesinin XML çıktısını almak ya da XML olarak verdiğimiz bilgiyi Java nesnesine çevirmek için kullanabileceğimiz çok şık bir kütüphane. [http://xstream.codehaus.org/](http://xstream.codehaus.org/) adresinde ikamet ediyor.
Yapılması gereken gayet basit, ilgili jarları indirip projemizin kütüphaneleri arasına ekliyoruz.
Kütüphanenin kullanımını anlaşılmasını kolaylaştırmak için “Ders” ve “Ogretmen” isimli iki nesne üzerinden aşağıda anlattım, kodları siz de kendi ortamınızda çalıştırabilirsiniz.
```java
package org.sukru.xstream.entity;
public class Ders {
 public Long id;

 public String ad;

 public Ogretmen ogretmen;
 public Ders(Long id, String ad, Ogretmen ogretmen) {

 this.id = id;

 this.ad = ad;

 this.ogretmen = ogretmen;

 }

//getters and setters

}
```
```java
package org.sukru.xstream.entity;
public class Ogretmen {
 public String ad;

 public String soyad;
 public Ogretmen(String ad, String soyad) {

 this.ad = ad;

 this.soyad = soyad;

 }

//getters and setters
@Override

 public String toString() {

     return "Ogretmen [ad=" + ad + ", soyad=" + soyad + "]";

 }

}
```
```java
package org.sukru.xstream.test;
import org.sukru.xstream.entity.Ders;

import org.sukru.xstream.entity.Ogretmen;
import com.thoughtworks.xstream.XStream;
public class XStreamTest {

 public static void main(String[] args) {

 // Yeni bir öğretmen üretelim.

 Ogretmen ogretmen = new Ogretmen("Yasin", "Kenar");

 // Yeni bir ders üretip öğretmenini belirtelim.

 Ders ders = new Ders((Long) 1L, "Software Engineering", ogretmen);
 // XStream sihiri şimdi başlıyor.

 XStream xstream = new XStream();

 xstream.alias("Ders", Ders.class); // Ders sınıfı için bir isim verdik,

 // yoksa paket isimlerini de dahil

 // ediyor.

 String xml = xstream.toXML(ders); // ders nesnesini xml’e çevir diyoruz.

 // Bakalım nasıl bir xml ürettik.

 System.out.println(xml);
 // Şimdi de oluşan xml i verip nesne alalım.

 Ders xmldenDers = (Ders) xstream.fromXML(xml);

 System.out.println("\n XML den Ders: "+xmldenDers.getId()+" – "+xmldenDers.getAd()+" – "+xmldenDers.getOgretmen().toString());

 }

}
```
ve XML çıktısı da aşağıdaki gibi oluyor.
```xml
<Ders>

  <id>1</id>

  <ad>Software Engineering</ad>

  <ogretmen>

    <ad>Yasin</ad>

    <soyad>Kenar</soyad>

  </ogretmen>

</Ders>
```
XML’den oluşturduğumuz nesneyi konsola bastırdığımız zaman aşağıdaki gibi olduğunu görürüz.

```text
XML den Ders: 1 – Software Engineering – Ogretmen [ad=Yasin, soyad=Kenar]
```
