---
title: "Java System Properties"
description: "Reading environment and system information at runtime with Java System Properties."
date: 2011-06-30
tags: [java]
translation: /blog/java-system-properties
---

In Java we can get **system information** through the keywords Java provides us.
`Properties properties = System.getProperties();`

With this expression we take the system properties into a "properties" object, then take the **entrySet** into a **Set** object with the expression below so we can iterate over it and look at each value one by one — because later we can look only at the ones that will be useful to us from time to time. You can see the example code below.
[java]

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

[/java]
When we run this code we can reach all the property keys. In the output each line gives a different piece of information about the system — you'll usually understand at a glance what you can query. Example: **java.version** gives you the Java version installed on the system. I've attached the output below.

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

Still, let me query a few of them on my own machine — let's see what kind of environment I'm working in 🙂

We'll pass them as parameters to the `System.getProperty(String property)` expression and it will return the value.
[java]

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

[/java]
And the output, as seen;

```
Java version: 1.6.0_25

Java vendor: Sun Microsystems Inc.

Operating system name: Windows 7

Operating system architecture: amd64

Operating system version: 6.1
```

Of course, using these may vary by preference, but in the industry it's printed into the logs at a program's startup to summarize the software version and the environment it runs in.
Take it easy.
