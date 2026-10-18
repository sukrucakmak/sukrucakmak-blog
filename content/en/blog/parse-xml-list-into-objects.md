---
title: "Parsing an XML List into Objects"
description: "Converting list elements in an XML file into Java objects."
date: 2011-08-11
tags: [java, xml]
translation: /blog/parse-xml-list-into-objects
---

I mentioned the XStream library in [this post](https://www.sukrucakmak.com/xstream-java-to-xml-xml-to-java/). It helps us convert Java to XML and XML to Java. However, I realized I skipped a topic: what if instead of an object we have objects — what will the output look like then? If there's a bunch of objects as a list in the XML, how do we convert them to Java? In this post I'll try to shed light on these topics, but reading the first post is a must since I'll use the "Ders" and "Ogretmen" classes from there.
Generating the XML output of a single "Ders" object was very easy and produced a result like the one below.
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
But what if there are multiple "Ders" objects — how will the output take shape and, before that, how do we generate it 🙂 In the code below I'll create two "Ogretmen" objects and use them to create three "Ders" objects (between lines 15 and 19). You can check the classes' members on the page I linked above.
Then I'll add the objects I created to a list (between lines 21 and 24).
Finally I'll give "my list" to the *toXML()* method of my **XStream** object. Yes, in the previous example I passed my "Ders" object directly; this time I'm passing the list (between lines 26 and 28).
```java
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
```
And finally, when we get the output, the XML looks like this.
```xml
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
```
What are the differences? Since there are multiple ders objects,

they sit between

```xml
<list>

</list>
```

and the "ogretmen" info of the "Ders" object whose id is 3

```xml
<ogretmen reference="../../Ders[2]/ogretmen"/>
```

is shown as being the same as the "ogretmen" info of the "Ders" at position 2.
Now let's get to our main topic: take this XML output, create a new xml file named "dersler.xml", and place it under a "files" directory we'll create in our project. You can see the project's new structure below.
[![](/images/parse-xml-list-into-objects-xstream-xml-reading.png)](/images/parse-xml-list-into-objects-xstream-xml-reading.png)
By reading this xml file we'll assign it to our object via **XStream**'s *fromXML()* method. Let's write out our steps one by one and implement them.

1. Get the file name. ("files/dersler.xml")

2. Create an XStream object and define an alias. (Since the object is stored as "Ders" in the XML, we must define the alias. If it were stored with its package name it wouldn't be needed.)

3. Read this file into a BufferedReader object.

4. Pass the BufferedReader object to the fromXML method on the XStream object so it gets the list.

5. Iterate the list to show we got the objects back.

If we write the code;
```java
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
```
We printed to the screen at the end — let's give the output too 🙂

```
1 - Türkçe	Yunus Emre

2 - Arapça	Yasin

3 - Farsça	Yasin
```

If you compile this code in your own environment and debug it step by step, you'll understand it much better.
Take it easy.
