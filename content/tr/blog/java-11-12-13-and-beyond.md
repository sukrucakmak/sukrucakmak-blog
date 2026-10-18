---
title: "Java 11-12-13 ve …"
description: Java 11 ve sonrasındaki sürümlerde gelen yenilikler: yeni sürüm döngüsü ve dikkat çeken özellikler.
date: 2019-02-13
tags: [java]
---

Merhabalar, Java 11 ile beraber Java kullanan herkesin hayatında önemli değişiklikler olacak. Bu yazımda onlardan bahsedeceğim.
JDK (Java Development Kit) artık her 6 ayda bir güncellenecek, bunlar da yıl içinde Mart ve Eylül aylarına denk geliyor. LTS (Long Term Support) dediğimiz “Uzun Dönem Destek” paketleri de 3 yılda bir çıkacak.

- 2018 Eylül – Java 11

- 2021 Eylül – Java 17

- 2024 Eylül – Java 23

- … gibi

Ve tabi ki ücretini ödeyen 3 seneden sonra da desteğini alabilir 🙂

## Lisanslama – Oracle JDK & Open JDK

Java 11 ile artık karşımızda Oracle JDK ve Open JDK kavramları var. Bundan sonra

> Oracle JDK – Oracle Binary Code License Aggrement
> Open JDK – GPL2

ile lisansları ile hayatımızda yer alacak. GPL2 tamamen açık kaynak ve ücretsiz. Oracle Binary Code Lisansı ise geliştirme yaparken yine ücretsiz kullanılabilecek ama üretim (production) ortamlarına ücretli olacak.

## Modası Geçen ve Kaldırılanlar

Enterprise API’lerden aşağıdakiler JDK içerisinden çıkarıldı.

- JAXB – xml binding

- JAX-WS – xml web services and endpoint technology

- CORBA – distributed object technology

- JTA – java transaction api

- JavaBeans Activation

Detayına şu adresten ulaşabilirsiniz; [https://openjdk.java.net/jeps/320](https://openjdk.java.net/jeps/320)
Ayrıca Thread sınıfından destroy() ve stop(Throwable obj) metodları çıkarıldı.
JDK 10 – [Thread](https://docs.oracle.com/javase/10/docs/api/java/lang/Thread.html)

JDK 11 – [Thread](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Thread.html)
JavaFX jdk içerisinden çıkarılarak ayrı bir kütüphane haline getirildi, adı da [OpenJFX](https://openjfx.io/)oldu.

## Dil ve Kütüphane Yenilikleri

JDK 9 ve 10’da deneysel olarak bulunan HTTP isteği gönderip yanıtını almak için kullanılabilen HttpClient sınıfı artık canlıda. HTTP2 desteği sunduğundan dolayı çoğu yeni proje için Java 11’e geçiş sebebi 🙂 API’yi tanımak için aşağıya bağlantılarını ekledim.
![](/images/java-11-12-13-and-beyond-httpclient-1024x422.png)
[HttpClient API](https://docs.oracle.com/en/java/javase/11/docs/api/java.net.http/java/net/http/HttpClient.html)

[HttpRequest API](https://docs.oracle.com/en/java/javase/11/docs/api/java.net.http/java/net/http/HttpRequest.html)

[HttpResponse API](https://docs.oracle.com/en/java/javase/11/docs/api/java.net.http/java/net/http/HttpResponse.html)

String sınıfına yeni kullanışlı metodlar eklendi.
![](/images/java-11-12-13-and-beyond-string-246x300.png)
**repeat**() – herhangi bir string i tekrarlamak için

**isBlank**() – string in boş olup olmadığına bakar

**strip**() – string’in önü ve arkasındaki boşluk karakterlerini trim() metodundan farklı olarak unicode karakterleri ile temizler

**lines**() – string in içindeki satırları “\r\n” yani line feed ve carriage return karakterleri stream olarak almamızı sağlar
Ayrıca [Files](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/nio/file/Files.html)sınıfına aşağıdaki yeni metodlar gelmiş;

![](/images/java-11-12-13-and-beyond-files.png)Unicode 10 desteği de yine JDK 11 ile geliyor.
Ben burada sadece en çok kullanabileceklerimi yazdım. Tam listeyi yazının en altına ekliyorum.

## Performans ve Güvenlik İyileştirmeleri

G1 Garbage Collector ile Java 11, Java 8’e göre %60 daha iyi performans sergiliyor. Bu da yazdığımız kodda herhangi bir değişiklik yapmadan Java 11’e geçirsek bile daha iyi bir performans alabileceğimizin göstergesi.
Ayrıca Epsilon GC ve Z GC adında iki yeni GC eklendi. İkisi de henüz deneysel.
Epsilon Garbage Collector, performans ölçüm amaçlı kullanılabilir, aşağıdaki parametrelerle açılabiliyor.

XX:+UnlockExperimentalVMOptions

XX:+UseEpsilonGC
Z Garbage Collector, multi-terabytes heap e çıkmayı sağlıyor. Sadece 64 bit Linux makinelerde çalışıyor.

XX:+UnlockExperimentalVMOptions

XX:+UseZGC
Güvenlik konusuna gelirsek, TLS 1.3 desteği sağlanmış ve eski güvenliğini kaybetmiş kriptografik algoritmalar çıkarılmış ve yeni daha güvenli algoritmalar eklenmiş. Handshake sırasındaki ilk mesaj hariç hepsi şifrelenmiş. Detaylarına aşağıdaki linkten erişilebilir.

[https://openjdk.java.net/jeps/332](https://openjdk.java.net/jeps/332)
Son olarak Oracle’ın açıkladığı[Java 11 değişiklikler listesi bağlantıdadır.](https://www.oracle.com/technetwork/java/javase/11-relnote-issues-5012449.html)
