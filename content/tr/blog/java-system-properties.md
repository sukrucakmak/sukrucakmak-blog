---
title: "Java System Properties"
description: "Java System Properties ile çalışma zamanında ortam ve sistem bilgilerini okuma."
date: 2011-06-30
tags: [java]
translation: /en/blog/java-system-properties
---

Java’da **sistem bilgilerini** Java’nın bize sunduğu anahtar kelimeler aracılığı ile alabiliriz.
`Properties properties = System.getProperties();`

ifadesi ile sistem özelliklerini bir “properties” nesnesine alalım, sonra **entrySet**i bir **Set**nesnesine aşağıdaki ifade ile alalım ki üzerinde dönerek tek tek değerlerine bakabilelim. Çünkü daha sonra sadece zaman zaman işimize yarayacak olanlara bakabilelim. Örnek kodu aşağıda görebilirsiniz.
```java
package org.sukru.system;
import java.util.Map.Entry;

import java.util.Properties;

import java.util.Set;
public class SystemProperties {
	public static void main(String[] args) {

		Properties properties = System.getProperties();

		Set<Entry<Object, Object>> sets = properties.entrySet();

		for (Entry<Object, Object> entry : sets) {

			System.out.println(entry.getKey());

		}

	}
}
```
Bu kodu çalıştırdığımızda gelen tüm anahtar kelimelere ulaşabiliriz. Çıktısında her bir satır sistem hakkında farklı bir bilgiyi veriyor, genellikle tek sefer anlarsınız neyi sorgulayabileceğinizi. Örnek: **java.version** size sistem üzerindeki Java versiyon bilgisini verecektir. Çıktıyı aşağıya ekledim.

```
java.runtime.name

sun.boot.library.path

java.vm.version

java.vm.vendor

java.vendor.url

path.separator

java.vm.name

file.encoding.pkg

sun.java.launcher

user.country

sun.os.patch.level

java.vm.specification.name

user.dir

java.runtime.version

java.awt.graphicsenv

java.endorsed.dirs

os.arch

java.io.tmpdir

line.separator

java.vm.specification.vendor

user.variant

os.name

sun.jnu.encoding

java.library.path

java.specification.name

java.class.version

sun.management.compiler

os.version

user.home

user.timezone

java.awt.printerjob

file.encoding

java.specification.version

java.class.path

user.name

java.vm.specification.version

sun.java.command

java.home

sun.arch.data.model

user.language

java.specification.vendor

awt.toolkit

java.vm.info

java.version

java.ext.dirs

sun.boot.class.path

java.vendor

file.separator

java.vendor.url.bug

sun.io.unicode.encoding

sun.cpu.endian

sun.desktop

sun.cpu.isalist
```

Yine de bir kaç tanesini kendi makinemde sorgulayayım, bakalım ben nasıl bir ortamda çalışıyormuşum 🙂

`System.getProperty(String property)` ifadesinde paramatre olarak vericez ve bize değerini dönecek.
```java
package org.sukru.system;
public class SystemInfo {
	public static void main(String[] args) {

		System.out.println("Java version: " + System.getProperty("java.version"));

		System.out.println("Java vendor: " + System.getProperty("java.vendor"));

		System.out.println("Operating system name: " + System.getProperty("os.name"));

		System.out.println("Operating system architecture: " + System.getProperty("os.arch"));

		System.out.println("Operating system version: " + System.getProperty("os.version"));

	}
}
```
Çıktısı da görüldüğü üzere;

```
Java version: 1.6.0_25

Java vendor: Sun Microsystems Inc.

Operating system name: Windows 7

Operating system architecture: amd64

Operating system version: 6.1
```

Tabi bunları kullanmak isteğe bağlı olarak değişebileceği gibi sektörde yazdığınız bir programın açılışında yazılım versiyonunu ve çalıştığı ortamı özetlemek bakımından loglar arasına bastırılır.
Kolay gelsin.
