---
title: "Web Servis İstemcisi (Web Service Client)"
date: 2011-07-01
tags: [java, web service]
---

Web servis hizmetinin nasıl sağlanacağını [önceki bir yazımda](https://www.sukrucakmak.com/2011/06/glassfish-uzerinde-web-servis/) GlassFish uygulama sunucusu için anlatmıştım. Lâkin web servis hizmetlerini kullanan bir de istemciler vardır. Bu yazıda da bir istemcinin nasıl oluşturulacağını ve çalıştırılacağını anlatmaya çalışacağım.
Eclipse üzerinde bir **web servis istemcisi** oluşturmak için öncelikle standart bir java projesi açıyorum. Önceki projenin adı “WebServiceGlassFish” olduğundan buna da “WebServiceGlassFishClient” dedim, herhangi bir isim vermekte elbette özgürsünüz.

[![](/images/web-service-client-web-service-client-project.png)](/images/web-service-client-web-service-client-project.png)
Proje adını girdikten sonra, tamam deyip projeyi oluşturuyoruz. Sırada istemciyi oluşturmak var; projeye sağ tıklayıp, New > Web Service Client diyoruz.

[![](/images/web-service-client-web-service-client.png)](/images/web-service-client-web-service-client.png)
Bir sonraki ekranda bize istemcinin adresini soruyor, yani web servisi nerede diyor. GlassFish üzerinde çalışan web servisinin adresini aşağıda görüldüğü gibi giriyorum, bir kaç saniye sonra algılıyor ve devam et butonu ve diğerleri aktif oluyor. Tamam diyoruz.

[![](/images/web-service-client-web-service-client-definition.png)](/images/web-service-client-web-service-client-definition.png)
Bu aşamalardan sonra artık Eclipse bizim için aşağıdaki gibi bir yapı hazırlıyor. Yapılanın özü şu; web service nerede, hangi metodları var, ne tür parametre alır vb sorulara cevap olacak sınıfları hazırlamak 🙂
[![](/images/web-service-client-web-service-client-project-structure.png)](/images/web-service-client-web-service-client-project-structure.png)
Sırada artık web servisi sorgulamak ve cevabını almak var,  bunun için “**WebServiceTest**” adında “**org.sukru.webservices.test**” paketi altında “**main**” metodu olan bir sınıf oluşturuyorum.

[![](/images/web-service-client-web-service-client-test-class.png)](/images/web-service-client-web-service-client-test-class.png)
Vee oluşan sınıf içinden sırasıyla şu işlemleri yapıyorum;

1. Web servis ile iletişime geçmek çin bir “service” oluşturuyorum.

2. “service” üzerinden bir bağlantı alıp HelloWorld nesneme atıyorum.

3. Metodun herhangi aksi bir durumda exception fırlatabileceğini tahmin eden Eclipse exception eklemem konusunda beni uyarıyor, ekliyorum.

4. Web servisin çağıracağım metodu -sayHello()- String döneceğinden buna uygun tanımı yapıp, web servisi çalıştırıyorum.

[java]

package org.sukru.webservices.test;
import org.sukru.webservices.HelloWorld;

import org.sukru.webservices.HelloWorldService;

import org.sukru.webservices.HelloWorldServiceLocator;
public class WebServiceTest {
	public static void main(String[] args) throws Exception {

		HelloWorldService service = new HelloWorldServiceLocator();

		HelloWorld port = service.getHelloWorldPort();

		String cevap = port.sayHello("Melih Sakarya");

		System.out.println("Web Servisinin Cevabı: "+ cevap );

	}
}

[/java]
Sağ tıklayıp Run As > Java Application deyince çıktının şu şekilde olduğunu görürsek **Web Servisinin Cevabı: Merhaba Melih Sakarya!**, sevinebiliriz 🙂
Kolay gelsin.
