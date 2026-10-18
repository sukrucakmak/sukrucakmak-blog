---
title: "XML’deki Listeyi Okuyarak Nesnelere Çevirme"
description: "XML dosyasındaki liste elemanlarını Java nesnelerine dönüştürme."
date: 2011-08-11
tags: [java, xml]
---

XStream kütüphanesinden [buradaki](https://www.sukrucakmak.com/xstream-java-to-xml-xml-to-java/) yazıda bahsetmiştim. Java’dan XML’e, XML’den Java’ya dönüşüm yapmamıza yardımcı oluyordu. Yalnız bir konuyu es geçtiğimi farkettim, ya nesne yerine nesneler olsa o zaman nasıl bir çıktı alacağız? XML’de liste halinde bir sürü nesne olsa o zaman nasıl Java’ya çevireceğiz? Bu yazıda bu konuları aydınlatmaya çalışacağım, fakat ilk yazının mutlaka okunması gerek, çünkü oradaki “Ders” ve “Ogretmen” sınıflarını kullanacağım.
Tek bir “Ders” nesnesinin XML çıktısını oluşturmak çok kolaydı ve aşağıdaki gibi bir sonuç veriyordu.
[xml]

<Ders>

  <id>1</id>

  <ad>Software Engineering</ad>

  <ogretmen>

    <ad>Yasin</ad>

    <soyad>Kenar</soyad>

  </ogretmen>

</Ders>

[/xml]
Peki ama birden fazla “Ders” nesnesi olsa ne olacak, çıktı nasıl şekillenecek ve öncesinde biz nasıl ürettireceğiz 🙂 Aşağıda kodda, iki adet “Ogretmen” nesnesi üretip bunları kullanarak da üç adet “Ders” nesnesi oluşturacağım (15 ve 19. satırlar arası). Sınıfların özelliklerine yukarıda bağlantısını verdiğim sayfadan bakabilirsiniz.
Sonra bu oluşturduğum nesneleri bir listeye ekleyeceğim (21 ve 24. satırlar arası).
Son olarak da **XStream** nesnemin *toXML()* metoduna “listemi” vereceğim. Evet önceki örnekte direk “Ders” nesnemi vermiştim, bu sefer listeyi veriyorum (26 ve 28. satırlar arası).
[java]

package org.sukru.xstream.test;
import java.util.ArrayList;

import java.util.List;
import org.sukru.xstream.entity.Ders;

import org.sukru.xstream.entity.Ogretmen;
import com.thoughtworks.xstream.XStream;
public class XStreamListTest {
	public static void main(String[] args) {
		Ogretmen o1 = new Ogretmen("Yunus Emre", "Aslan");

		Ogretmen o2 = new Ogretmen("Yasin", "Kenar");

		Ders d1 = new Ders(1L, "Türkçe", o1);

		Ders d2 = new Ders(2L, "Arapça", o2);

		Ders d3 = new Ders(3L, "Farsça", o2);
		List<Ders> dersList = new ArrayList<Ders>();

		dersList.add(d1);

		dersList.add(d2);

		dersList.add(d3);
		XStream xstream = new XStream();

		xstream.alias("Ders", Ders.class);

		String xml = xstream.toXML(dersList);

		System.out.println(xml);

	}

}

[/java]
En son olarak da çıktıyı aldığımızda XML aşağıdaki gibi oluyor.
[xml]

<list>

  <Ders>

    <id>1</id>

    <ad>Türkçe</ad>

    <ogretmen>

      <ad>Yunus Emre</ad>

      <soyad>Aslan</soyad>

    </ogretmen>

  </Ders>

  <Ders>

    <id>2</id>

    <ad>Arapça</ad>

    <ogretmen>

      <ad>Yasin</ad>

      <soyad>Kenar</soyad>

    </ogretmen>

  </Ders>

  <Ders>

    <id>3</id>

    <ad>Farsça</ad>

    <ogretmen reference="../../Ders[2]/ogretmen"/>

  </Ders>

</list>

[/xml]
Farkları neler? Birden fazla ders nesnesi var

[xml]

<list>

</list>

[/xml]

arasında yer alıyor ve id bilgisi 3 olan “Ders” nesnesinin “ogretmen” bilgisi

[xml]

<ogretmen reference="../../Ders[2]/ogretmen"/>

[/xml]

şeklinde 2. sıradaki “Ders”in “ogretmen” bilgisi ile aynı olarak gösteriliyor.
Şimdi asıl konumuza gelelim, bu xml çıktısını alıp yeni bir xml dosyası oluşturalım, adını da “dersler.xml” olarak verip projemizin altında oluşturacağımız “files” dizini altında oluşturalım. Aşağıda projenin yeni yapısını görebilirsiniz.
[![](/images/parse-xml-list-into-objects-xstream-xml-reading.png)](/images/parse-xml-list-into-objects-xstream-xml-reading.png)
Bu xml dosyasını okuyarak **XStream**in *fromXML()* metodu ile nesnemize atayacağız. Adım adım işlemlerimizi yazıp gerçekleyelim.

1. Dosya ismini al. (“files/dersler.xml”)

2. XStream nesnesi oluştur ve alias tanımla. (XML de nesne “Ders” olarak tutulduğu için alias tanımlamalıyız. Paket ismi ile olsaydı gerek kalmazdı. )

3. BufferedReader nesnesine bu dosyayı okuyarak at.

4. XStream nesnesi üzerinden fromXML metoduna BufferedReader nesnesini ver, listeyi alsın.

5. Listeyi dönerek nesneyi aldığımızı gösterelim.

Kodunu yazarsak;
[java]

package org.sukru.xstream.test;
import java.io.BufferedReader;

import java.io.FileNotFoundException;

import java.io.FileReader;

import java.util.List;
import org.sukru.xstream.entity.Ders;
import com.thoughtworks.xstream.XStream;
public class XStreamReadingListTest {
	@SuppressWarnings("unchecked")

	public static void main(String[] args) {

		String file = "files/dersler.xml";

		BufferedReader reader = null;

		XStream xstream = new XStream();

		xstream.alias("Ders", Ders.class);

		try {

			reader = new BufferedReader(new FileReader(file));
		} catch (FileNotFoundException e) {

			System.out.println("[" + file + "] adresinde belirtilen dosya bulunamadı!");

			e.printStackTrace();

		}
		StringBuffer sb = new StringBuffer();
		List<Ders> dersList = (List<Ders>) xstream.fromXML(reader);

		for (Ders ders : dersList) {

			sb.append(ders.getId()).append(" – ").append(ders.getAd()).append("\t").append(ders.getOgretmen().getAd()).append("\n");

		}

		System.out.println(sb);

	}

}

[/java]
En sonunda ekrana bastırmıştık, çıktıyı da verelim 🙂

```
1 - Türkçe	Yunus Emre

2 - Arapça	Yasin

3 - Farsça	Yasin
```

Bu kodları kendi ortamınızda derleyip adım adım debug yaparsanız, çok daha iyi anlayabilirsiniz.
Kolay gelsin.
