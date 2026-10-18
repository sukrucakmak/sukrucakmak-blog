---
title: "XStream – Java to XML, XML to Java"
description: "Converting Java objects to XML and XML back to objects with the XStream library."
date: 2011-06-15
tags: [java, xml]
translation: /blog/xstream-java-to-xml-xml-to-java
---

[![](/images/xstream-java-to-xml-xml-to-java-xstream_logo-300x98.gif)](https://www.sukrucakmak.com/wp-content/uploads/2011/06/xstream_logo.gif)

A very elegant library we can use to get the XML output of a Java object or to convert data given as XML back into a Java object. It lives at [http://xstream.codehaus.org/](http://xstream.codehaus.org/).
What needs to be done is quite simple: download the relevant jars and add them to our project's libraries.
To make the library's usage easy to understand, I explained it below through two objects named "Ders" (Course) and "Ogretmen" (Teacher); you can run the code in your own environment too.
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

 // Let's create a new teacher.

 Ogretmen ogretmen = new Ogretmen("Yasin", "Kenar");

 // Let's create a new course and set its teacher.

 Ders ders = new Ders((Long) 1L, "Software Engineering", ogretmen);
 // The XStream magic starts now.

 XStream xstream = new XStream();

 xstream.alias("Ders", Ders.class); // we gave the Ders class a name,

 // otherwise it also includes the

 // package names.

 String xml = xstream.toXML(ders); // we tell it to convert the ders object to xml.

 // Let's see what kind of XML we produced.

 System.out.println(xml);
 // Now let's give the generated XML back and get an object.

 Ders xmldenDers = (Ders) xstream.fromXML(xml);

 System.out.println("\n XML den Ders: "+xmldenDers.getId()+" – "+xmldenDers.getAd()+" – "+xmldenDers.getOgretmen().toString());

 }

}
```
And the XML output looks like the one below.
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
When we print the object created from the XML to the console, we see it looks like this.

```text
XML den Ders: 1 – Software Engineering – Ogretmen [ad=Yasin, soyad=Kenar]
```
