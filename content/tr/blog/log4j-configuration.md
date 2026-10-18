---
title: "Log4j Konfigürasyon"
description: Apache log4j yapılandırması: appender, layout ve log seviyesi ayarları.
date: 2011-06-27
tags: [java, logging]
---

Apache log4j [şu yazıda](https://www.sukrucakmak.com/apache-log4j/) da bahsettiğim gibi bir loglama mekanızmasıdır ve bize şu soruların cevaplarını verir;

1. Kim?

2. Ne?

3. Ne zaman?

4. Nerede?

Şimdi bilmemiz gereken temel kavramlardan biraz bahsetmenin zamanıdır.
**Log Seviyeleri (LEVELS)**[TRACE](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#TRACE),

[DEBUG](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#DEBUG),

[INFO](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#INFO),

[WARN](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#WARN),

[ERROR](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#ERROR),

[FATAL](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#FATAL) olmasına rağmen, kendi log seviyenizi de yazabilirsiniz ama önerilmediğini de belirteyim.
Seviyeler arasındaki sıralama da şu şekilde **`DEBUG < INFO < WARN < ERROR < FATAL`.**Bu sıralamanın ne işe yaradığını aşağıdaki örnekte daha iyi anlayacağız.
**Log Yazıcılar (APPENDERS)**Logları çeşitli ortamlara yazmak mümkün, aşağıda birkaçının adı var. Ben, daha çok dosyaya ve console ortamına yazıyorum.

- FileAppender

- ConsoleAppender

- SocketAppender

- SyslogAppender

- NTEventLogAppender

- SMTPAppender

**Düzen (LAYOUTS)**Logun nasıl görüneceğine dair bilgileri içerir; zaman logun neresinde yazsın, hangi metod olduğu neresinde vb.

| Kısaltma | Anlamı |
|---|---|
| %r | Loglama başlayana kadar ne kadar zaman harcandı. |
| %t | Loglama olayını üreten thread’in ismi. |
| %p | Logun seviyesi. |
| %c | Logun kategorisi yani üretildiği sınıfın paket bilgisi vb. |
| %x | Logun bazı kontrolleri için. |
| %m | Mesaj |
| %n | Yeni satıra geçmek için. |
| %L | Hangi satırda olduğu bilgisi. |
| %d | Logun üretildiği zaman. |

Şimdi bu kadar teorik bilgi ile çalışan bir uygulama yapacağım. Projemin altına “**config**” adında bir klasör açıyorum altına da “**log4j.xml**” adını verdiğim aşağıdaki dosyayı hazırlıyorum.
[xml]

<?xml version="1.0" encoding="UTF-8"?>

<!DOCTYPE log4j:configuration PUBLIC "-//LOGGER" "http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/xml/doc-files/log4j.dtd">

<log4j:configuration>
 <appender name="stdout" class="org.apache.log4j.ConsoleAppender">

	<layout class="org.apache.log4j.PatternLayout">

		<param name="ConversionPattern" value="%d [%t] %5p %c{1}:%L – %m %n" />

	</layout>

  </appender>
 <root>

   <appender-ref ref="stdout" />

 </root>
</log4j:configuration>

[/xml]
Şimdi yukarıdaki xml’i biraz açıklayayım; Program bu xml’i okumaya başlarken önce **root** altına bakar ve bir **appender** arar ki oraya log’u yazabilsin. Bizimkinin **stdout** isminde bir tane var, gider onu **appenderlar**arasında bulur, bizimkinin **ConsoleAppender**yani console’a yazan bir **appender**olduğunu anlar, **pattern**‘ine göre **appender**üzerine yazar. Hikaye bu şekilde 🙂
Şimdi de pattern’i biraz açalım;

- ***%d*** – Çalışma zamanını göster (herhangi bir formatter vermedim ama yaylı parantezler içinde istediğiniz *date format pattern*i yazabilirsiniz)

- ***[%t]*** – Hangi metodun çalıştığını göster, “[” ve “]” karakterleri arasına al.

- ***%5p*** – Logun seviyesini göster.

- ***%c{1}*** – Logun kategorisini 1. seviyeye kadar göster. (Bir de kaldırıp deneyin 🙂 )

- ***%L*** – Hangi satırın çalıştığını göster.

- ***%m*** – Mesajı yaz.

- ***%n*** – Yeni gelen mesajı bir alt satırda yaz.

Şimdi log4j’yi kullanalım. Önce bir sınıf yazalım.
[java]

package org.sukru.log4j;
public class Student {
 private Long studentNumber;

 private String firstName;

 private String lastName;
 public Student(Long studentNumber, String firstName, String lastName) {

   this.studentNumber = studentNumber;

   this.firstName = firstName;

   this.lastName = lastName;

 }

  // getters and setters

}

[/java]
Log4j için test sınıfımız.
[java]

package org.sukru.log4j;
import org.apache.log4j.Logger;

import org.apache.log4j.xml.DOMConfigurator;
public class Log4jTest {
  private static Logger logger;
  public static void main(String[] args) {

	configureLog4j();   //log4j’yi ayağa kaldırması için bu metodu yazdım.

	logger.info("Initializing a new Student…");

	Student student = new Student(100L, "Tuncay", "Uzun");

	logger.info("new Student initialized: "+student.getFirstName()+" "+student.getLastName());

  }
  private static void configureLog4j() {

	DOMConfigurator.configureAndWatch("config/log4j.xml");   //log4j konfigürasyon dosyasının projedeki yerini veriyoruz.

	logger = Logger.getLogger(Log4jTest.class);

  }

}

[/java]
Bakalım nasıl bir log elde ettik – bence gayet açıklayıcı- 🙂
[shell]
2011-06-27 14:42:19,507 [main]  INFO Log4jTest:12 – Initializing a new Student…

2011-06-27 14:42:19,511 [main]  INFO Log4jTest:14 – new Student initialized: Tuncay Uzun
[/shell]
Şimdi xml dosyası ile biraz oynayalım ve **root** altına şu ifadeyi yazarak log seviyemizi **info** dan daha az kapsamlı **warn**a çekelim. (Yukarıda sıralamasını yazmıştım 😉 )

[xml]<level value="warn" />[/xml]

Şimdi tekrar çalıştırırsak, herhangi bir log yazmadığını görürüz 🙂 Yani xml deki tek bir ifade ile tüm projedeki log seviyesini **warn** yaptık ve bizim **info** olara baktıklarımızın loga yazılmasını engelledik, varsa eğer **warn**ve üzeri ifadeler görülecek 😉
Kolay gelsin.
