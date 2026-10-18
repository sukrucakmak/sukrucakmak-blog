---
title: "Generic Types"
description: "Java'da generic tiplerin neden ortaya çıktığı ve ClassCastException'lardan nasıl korundukları."
date: 2011-07-08
tags: [generics, java]
---

Programlamada bazen öyle olur ki bazı değerlerin tipleri önceden kestirilemez. Siz gelecek değerin `Integer` olmasını beklerken, bir bakmışsınız `String` gelmiş, uygulamanız `java.lang.ClassCastException` hatası almış, `java.lang.String cannot be cast to java.lang.Integer` diyerek gelen String değerin Integer’a dönüştürülememiş olur.
İşte bu durumda **Generic Types** (Genel Tipler) kavramı karşımıza çıkar.
Şimdi yukarıda bahsettiğim olayı göstermek açısından hata ile karşılaştığımız bir örneği gösteriyorum. Object tipinde bir değişkeni olan Box isimli bir sınıf var.
[java]

package org.sukru.classic;
public class Box {
	private Object object;
	public void add(Object object) {

		this.object = object;

	}
	public Object get() {

		return object;

	}

}

[/java]
add() metoduna gönderdiğimiz değişkenin tipi ne olursa kabul edecek de, get() metodunda mecburen “**cast**” etmemiz gerekecek.
[java]

package org.sukru.classic;
import org.sukru.classic.Box;
public class BoxTest {
	public static void main(String[] args) {

        Box integerBox = new Box();

        integerBox.add(new Integer(10)); // Ya burada String ekleseydim?

        Integer someInteger = (Integer) integerBox.get();

        System.out.println(someInteger);

	}

}

[/java]
Evet, bu kodları çalıştırdığımızda buraya kadar bir sıkıntı yok ama kod içine de not düştüğüm gibi ya orada `integerBox.add("10");` şeklinde String olarak parametre verseydim işte o zaman ilk bahsettiğim `java.lang.ClassCastException` hatasını alırız.
Çözüme gelirsek, Box sınıfını  ifadesiyle aşağıdaki gibi generic type olduğunu belirtirsek, ne gelirse gelsin 🙂 bu arada sınıf isimleri aynı olmasına rağmen farklı bir paket altında çalıştığıma dikkat edin.
[java]

package org.sukru.generics;
public class Box<T> {

	private T t; // T burada "Type" anlamına gelir.
	public void add(T t) {

		this.t = t;

	}
	public T get() {

		return t;

	}

}

[/java]
Yukarıdaki [plain]Box<T>[/plain] ifadesindeki T’nin anlamını biraz açarsak “Type” anlamına geldiğini söyleyebiliriz, yani bu sınıftan herhangi bir tipte nesne tanımlanabilir.

[plain]Box<Integer> integerBox = new Box<Integer>();[/plain] da olabilir [plain]Box<String> integerBox = new Box<String>(); [/plain] da ya herhangi başka bir tip, primitive tipler hariç!
Şimdi buradan hareketle Integer tipinde bir Box nesnesi üreterek üzerinden gidilecek.
[java]

package org.sukru.generics;
public class BoxTest {
	public static void main(String[] args) {

		Box<Integer> integerBox = new Box<Integer>();

		integerBox.add(new Integer(10));

		Integer someInteger = integerBox.get(); // cast’e gerek yok!

		System.out.println(someInteger);

	}

}

[/java]
Önceki örnekte Integer tipine dönüştürmeye (cast) ihtiyaç vardı, bu örnekte gerek yok. Ayrıca daha güzeli, geliştirme ortamları (IDE) siz farkında olmadan add() metoduna Integer’dan farklı bir tip göndermeye kalkarsanız, sizi daha çalıştırmadan uyarır 🙂 Bence en önemlisi bu 🙂
Bu arada Java 7 ile beraber nesne üretme ifadesi kısalarak [plain]Box<Integer> integerBox = new Box<>();[/plain] şeklinde olacakmış, yani *diamond operator* denilen kısıma tekrardan tip belirtmeye gerek kalmayacakmış.
Aklınızda şu soru belirmiş olabilir,  bu “T” de neyin nesi idi, ben başka birşey kullanabilir miyim. İşte burada da Java Naming Convention dediğimiz Java İsimlendirme Standartları devreye giriyor.

- E – Element (genellikle Java Collection Framework da kullanılıyor)

- K – Key

- N – Number

- T – Type

- V – Value

- S,U,V vb. (eğer 2., 3., 4. tipler gerekirse de bu harfler seçiliyor)

Standartlar olmasaydı birbirlerinden ayırt etmek zor olacaktı, yani gözünü seveyim standartların 🙂

Umarım konuyu anlamak açısından faydalı olmuştur.
Kolay gelsin.
*Not:* Anlaşılırlığı artırmak bakımından [http://download.oracle.com/javase/tutorial/java/generics/index.html](http://download.oracle.com/javase/tutorial/java/generics/index.html) adresindeki örnekler kullanılmıştır.
