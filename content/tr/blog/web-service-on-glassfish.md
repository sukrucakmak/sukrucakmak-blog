---
title: "GlassFish Üzerinde Web Servis"
description: "GlassFish uygulama sunucusu üzerinde Java web servisi yayınlama."
date: 2011-06-28
tags: [application servers, glassfish, java, web service]
translation: /en/blog/web-service-on-glassfish
---

Web servis ([Web Service](http://en.wikipedia.org/wiki/Web_service)) kavramı, iki cihaz arasındaki iletişim yöntemlerinden biridir.

Java ile web servisi geliştirmenin birden çok yolu var. Son yeniliklerle beraber “**[Annotations](http://en.wikipedia.org/wiki/Java_annotation)**” kavramı sayesinde bu iş daha da kolaylaştı, elle wsdl üretmeye gerek kalmadı, gerekli annotation işaretlerini yerine koyunca program çalışırken wsdl kendi kendine oluşuyor.
[**GlassFish**](http://glassfish.java.net/) bilindiği üzere JavaEE’nin temel taşlarından biri olan açık kaynak uygulama sunucusu, sektörde kullanımı diğer sunuculara göre az olabilir ama en bilindiklerden ve bana göre kullanması çok kolay olanlardan biri. Yönetim paneli kullanımını hakkaten kolaylaştırıyor.
Şimdi GlassFish üzerinde gerçekleştireceğimiz web servis örneğine gelirsek, edinmemiz gereken malzemeler şunlar;

- [GlassFish 3 uygulama sunucusu](http://glassfish.java.net/)[![](/images/web-service-on-glassfish-glassfish_logo.png)](/images/web-service-on-glassfish-glassfish_logo.png)

- [Eclipse IDE for Java EE Developers](http://www.eclipse.org/downloads/)

Adım adım ilerleyelim. Yapacağımız web servisi, en basitinden aldığı “String” parametreye karşılık “Merhaba {parametre}” desin.
Eclipse üzerinde yeni bir “**Dynamic Web Project**” açalım. Resimde görüldüğü gibi adını “**WebServiceGlassFish**” koydum.

[![](/images/web-service-on-glassfish-web-service-glassfish.png)](/images/web-service-on-glassfish-web-service-glassfish.png)
İleri dedikten sonra bize kaynak kodları nereye yazdığımı soruyor, hiç dokunmadan ileri diyoruz, karşımıza aşağıdaki ekran geliyor, web.xml oluşturmasını özellikle istiyoruz.

[![](/images/web-service-on-glassfish-web-xml.png)](/images/web-service-on-glassfish-web-xml.png)
Sıra geldi kodlamamıza, artık sınıfımızı ve yazmak istediğimiz metodları gerçekleştirelim. Proje içinde yeni bir Java sınıfı oluşturup adını “**HelloWorld**” veriyorum, sınıfını da “**org.sukru.webservices”**olarak yazıyorum.

[![](/images/web-service-on-glassfish-web-service-class.png)](/images/web-service-on-glassfish-web-service-class.png)
Bir sınıfın web servis olabilmesi için sınıfın başına **@WebService()** annotation işareti koyulur, web servis metodu olması istediğimiz metodun başına da **@WebMethod()** annotation işareti konulur. Tamam bilmemiz gerekenler bu kadardı, dağılabilirsiniz 🙂 Şaka bir yana örnek java kodu aşağıda…

[java]

package org.sukru.webservices;
import javax.jws.WebMethod;

import javax.jws.WebService;
@WebService()

public class HelloWorld {
	@WebMethod()

	public String sayHello(String name) {

		System.out.println("Merhaba " + name);

		return "Merhaba" + name + "!";

	}

}

[/java]
Yapılması gereken ek bir şey de web.xml üzerinde servlet tanımlarını yapmak, en başta oluşan web.xml içerisine aşağıdaki kodu yazıyorum.

[xml]

<servlet>

	<display-name>HelloWorld</display-name>

	<servlet-name>HelloWorld</servlet-name>

	<servlet-class>org.sukru.webservices.HelloWorld</servlet-class>

</servlet>

<servlet-mapping>

	<servlet-name>HelloWorld</servlet-name>

	<url-pattern>/HelloWorld</url-pattern>

</servlet-mapping>

[/xml]
Böylelikle, HelloWorld isminde bir servletim olduğunu, url bilgisi ve sınıfının nerede olduğunu eklemiş oldum ki uygulama sunucusu tanısın uygulamamızı.
Sıra artık önemli noktalardan birine yani GlassFish’e yüklemeye geldi. Eclipse’in Servers tabında yeni sunucu eklemek istiyoruz ama standartında GlassFish i bulamazsınız o sebeple, Servers altında New > Download Additional Adapters yolunu takip ediyoruz, gelen listeden “**Oracle GlassFish Server Tools**” seçimini yapıyoruz, kısa bir yüklemeden sonra Eclipse i yeniden başlatmak istiyor, başlat diyoruz.
Şimdi ekleyebiliriz. Aşağıda örneği var.

[![](/images/web-service-on-glassfish-eclipse-server-glassfish.png)](/images/web-service-on-glassfish-eclipse-server-glassfish.png)
GlassFish kullanıcı adı ve şifremizi giriyoruz.

[![](/images/web-service-on-glassfish-eclipse-server-glassfish-password.png)](/images/web-service-on-glassfish-eclipse-server-glassfish-password.png)
Şifre ekranından sonra hangi uygulamaları sunucuya atacağımızı soruyor, web servis uygulamamamızı seçiyoruz. Eğer sizin Eclipse inize GlassFish sunucusu tanımlanmışsa sadece sunucuya sağ tıklayıp “Add and Remove” ile de sadece uygulamayı yükleyebilirsiniz.
Son olarak projenin build-path ine GlassFish i göstermemiz lazım. proje sağ tıklayıp *Build Path > Configure Build-Path* yolunu takip edip Server Runtime üzerinden sunucuyu ekliyoruz.

[![](/images/web-service-on-glassfish-web-service-properties-add-glassfish-library.png)](/images/web-service-on-glassfish-web-service-properties-add-glassfish-library.png)
Bundan sonra GlassFish’i başlatın ve uygulamanın artık GlassFish altında çalışıyor olması lazım 🙂
GlassFish Yönetim Ekranından (http://localhost:4848) -eğer değişiklik yapmadıysanız- görebiliriz, sunucuya giriş yaptıktan sonra soldaki “Applications” menüsüne tıklayarak yüklü uygulamaları görebiliriz.

[![](/images/web-service-on-glassfish-glassfish-applications.png)](/images/web-service-on-glassfish-glassfish-applications.png)
Görüldüğü üzere **WebServiceGlassFish** projesi GlassFish altına yüklenmiş ki zaten server altına eclipse içinden ilk eklemenizde de konsola yüklenip yüklenemediği bilgisini yazar.
Şimdi o ekrandan “launch” yani çalıştır dedikten sonra **/HelloWorld** servlet ismini tarayıcıya aşağıdaki gibi ekleyince karşınıza web servis hakkında bazı bilgiler gelecektir.

[![](/images/web-service-on-glassfish-glassfish-web-service-servlet.png)](/images/web-service-on-glassfish-glassfish-web-service-servlet.png)
WSDL adresine tıklayınca da wsdl a ulaşabileceksiniz, bendekinin ekran görüntüsü şu şekilde.

[![](/images/web-service-on-glassfish-glassfish-web-service-wsdl.png)](/images/web-service-on-glassfish-glassfish-web-service-wsdl.png)
Web servisi artık kullanıma hazır. Başka bir yazıda da bu web servisinin testini yaparız inşallah 🙂 (Ben yaptım da buraya yazması var bir de :D)
Kolay gelsin.
