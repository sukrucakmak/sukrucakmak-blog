---
title: "Java Package"
description: "The package concept in Java: organizing classes, preventing name clashes, and access control."
date: 2011-08-01
tags: [java]
translation: /blog/java-package
---

The Java Package concept is used to organize Java classes in a tidy way. Classes in the same category or with similar responsibilities are grouped together to provide logical integrity. You can think of it like folders on your computer; keep my music here, put my pictures there…

- A "package" creates a unique namespace for a Java class. For example, the **String** class is unique under the **java.lang** package, and the package it lives in is unique too.

- Classes in the same package become each other's "package-access members" — members accessible at package level. This concept may feel abstract right now; we'll dig into "access" in detail in another post where it will make more sense.

**Naming Convention**

Like most software conventions, this isn't mandatory but it's a structure people can understand and agree on more easily when followed. For example, I currently work at a company called **[i2i systems](http://www.i2i-systems.com)** and I'm writing a commercial application called "EasyProv"; I want to group the utilities I frequently use in the application under a package;

[java]

package com.i2i.easyprov.util;

[/java]

Reading it again we get the following information;

1. **com** – a commercial package

2. **i2i** – written by the i2i company

3. **easyprov** – belongs to the easyprov project

4. **util** – utilities live here

In short, what I can find under this package is visible upfront 🙂
**Some of Java's core packages…**

- [java.lang](http://download.oracle.com/javase/6/docs/api/java/lang/package-summary.html) 	— the package with the language's functionality and basic types, like String, Integer…

- [java.util](http://download.oracle.com/javase/6/docs/api/java/util/package-summary.html)	— classes for collection data structures

- [java.io](http://download.oracle.com/javase/6/docs/api/java/io/package-summary.html) 	— file operations

- [java.math](http://download.oracle.com/javase/6/docs/api//java/math/package-summary.html) 	— mathematical operations

- [java.net](http://download.oracle.com/javase/6/docs/api/java/net/package-summary.html) 	— network operations, socket programming, etc…

- [java.security](http://download.oracle.com/javase/6/docs/api/java/security/package-summary.html) 	— key generation, encryption, decryption…

- [java.sql](http://download.oracle.com/javase/6/docs/api/java/sql/package-summary.html) 	— Java Database Connectivity (JDBC) for accessing databases

- [java.awt](http://download.oracle.com/javase/6/docs/api/java/awt/package-summary.html) 	— the visual UI component package for desktop applications

- [javax.swing](http://download.oracle.com/javase/6/docs/api/javax/swing/package-summary.html) 	— like awt but a platform-independent UI component package

- [java.applet](http://download.oracle.com/javase/6/docs/api/java/applet/package-summary.html) 	— the package containing classes for developing applets

Hope it was useful 🙂 may the "default package" be the one you hate most.

Take it easy.
**Resources**

1. http://download.oracle.com/javase/tutorial/java/concepts/package.html

2. http://en.wikipedia.org/wiki/Java_package
