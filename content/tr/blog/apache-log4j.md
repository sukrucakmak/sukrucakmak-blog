---
title: "Apache log4j"
date: 2011-06-27
tags: [java, logging]
---

[Apache loj4j](http://logging.apache.org/log4j/) Java tabanlı bir **log**(sistem günlüğü) tutma mekanizmasıdır. Sektörde sevilir, kullanışlıdır. Projelere entegre edilmesi ve kullanması da kolay sayılabilir.

![Apache log4j](http://logging.apache.org/log4j/2.x/images/logo.jpg)

Yapmamız gerekenler;

- [jar dosyasını indirip](http://logging.apache.org/log4j/1.2/download.html) projemizin kütüphaneleri arasına eklemek

- projemizin build path’ine bu jarı göstermek.

Bu adımlardan sonra log4j ile çalışmaya hazırız. Örnek olması açısından bir “**Student**” sınıfı yazıp, onu loglamaya çalışacağım. Uygulama çok temek olacak, hatta o kadar temel olacak ki, normalde 2 çeşit log4j ayarlama yolu var;

1. property file hazırlayarak

2. XML dosyası hazırlayıp

fakat ben log4j’nin sağlamış olduğu “**BasicConfigurator**” sınıfının “***configure()***” metodu yardımıyla herhangi bir dosya kullanmadan log4j’i ayağa kaldıracağım.

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
Loj4j’yi ayağa kaldırıp, kullandığımız test sınıfımızı da yazalım.
[java]

package org.sukru.log4j;
import org.apache.log4j.BasicConfigurator;

import org.apache.log4j.Logger;
public class Log4jTest {
	public static void main(String[] args) {

		BasicConfigurator.configure(); // log4j’yi ayağa kaldıralım.

		Logger logger = Logger.getLogger(Student.class); // hangi sınıfı takip edeceğimizi belirtelim.

		logger.info("Initializing new Student…");

		Student student = new Student(100L, "Yunus Emre", "Aslan");

		logger.info("new Student initialized: "+student.getFirstName()+" "+student.getLastName());

	}

}

[/java]
Bu sınıfı çalıştırdığımız zaman çıktısı şu şekilde olacaktır.
[shell]

0 [main] INFO org.sukru.log4j.Student  – Initializing a new Student…

2 [main] INFO org.sukru.log4j.Student  – new Student initialized: Yunus Emre Aslan

[/shell]
Bilgi amaçlı “**info(Object message)**” metodunu kullandım ama isteğe ve amaca göre şu metodlar kullanılabilir;

- fatal()

- error()

- warn()

- debug()

- trace()

- info()

Diğer yapılandırma usüllerini başka bir yazıda anlatacağım. Giriş için bunun yeterli olacağını düşünüyorum. Kolay gelsin.
