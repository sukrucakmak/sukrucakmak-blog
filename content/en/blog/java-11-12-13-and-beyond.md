---
title: "Java 11-12-13 and Beyond"
description: "What's new in Java 11 and later: the new release cadence and the standout features."
date: 2019-02-13
tags: [java]
translation: /blog/java-11-12-13-and-beyond
---

Hello, Java 11 brings important changes to the life of everyone who uses Java. I'll talk about them in this post.
The JDK (Java Development Kit) will now be updated every 6 months — in March and September each year. What we call LTS (Long Term Support) releases will come out every 3 years.

- September 2018 – Java 11

- September 2021 – Java 17

- September 2024 – Java 23

- … and so on

And of course, those who pay can keep getting support beyond 3 years 🙂

## Licensing – Oracle JDK & Open JDK

With Java 11 we now have the concepts of Oracle JDK and Open JDK. From now on

> Oracle JDK – Oracle Binary Code License Aggrement
> Open JDK – GPL2

licenses will be part of our lives. GPL2 is fully open source and free. The Oracle Binary Code License is free while developing but will be paid in production environments.

## Deprecated and Removed Items

The following Enterprise APIs were removed from the JDK.

- JAXB – xml binding

- JAX-WS – xml web services and endpoint technology

- CORBA – distributed object technology

- JTA – java transaction api

- JavaBeans Activation

Details here; [https://openjdk.java.net/jeps/320](https://openjdk.java.net/jeps/320)
Also the destroy() and stop(Throwable obj) methods were removed from the Thread class.
JDK 10 – [Thread](https://docs.oracle.com/javase/10/docs/api/java/lang/Thread.html)

JDK 11 – [Thread](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Thread.html)
JavaFX was taken out of the JDK and turned into a separate library named [OpenJFX](https://openjfx.io/).

## Language and Library Novelties

The HttpClient class, which existed experimentally in JDK 9 and 10 for sending HTTP requests and reading responses, is now live. Since it offers HTTP/2 support, it's a reason to move to Java 11 for most new projects 🙂 I've added the API links below.
![](/images/java-11-12-13-and-beyond-httpclient-1024x422.png)
[HttpClient API](https://docs.oracle.com/en/java/javase/11/docs/api/java.net.http/java/net/http/HttpClient.html)

[HttpRequest API](https://docs.oracle.com/en/java/javase/11/docs/api/java.net.http/java/net/http/HttpRequest.html)

[HttpResponse API](https://docs.oracle.com/en/java/javase/11/docs/api/java.net.http/java/net/http/HttpResponse.html)

New handy methods were added to the String class.
![](/images/java-11-12-13-and-beyond-string-246x300.png)
**repeat**() – to repeat a string

**isBlank**() – checks whether a string is blank

**strip**() – unlike trim(), cleans whitespace characters at the start and end of a string including Unicode characters

**lines**() – lets us get the lines inside a string split on "\r\n" (line feed and carriage return characters) as a stream
Also the [Files](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/nio/file/Files.html) class got the following new methods;

![](/images/java-11-12-13-and-beyond-files.png)Unicode 10 support also comes with JDK 11.
I only wrote the ones I think I'll use the most here. I'm adding the full list at the bottom of the post.

## Performance and Security Improvements

With the G1 Garbage Collector, Java 11 shows 60% better performance than Java 8. That means we can get better performance just by upgrading to Java 11 without changing any of our code.
Two new GCs were also added: Epsilon GC and Z GC. Both are still experimental.
Epsilon Garbage Collector can be used for performance measurement; it can be enabled with the parameters below.

XX:+UnlockExperimentalVMOptions

XX:+UseEpsilonGC
Z Garbage Collector allows scaling to multi-terabyte heaps. It only works on 64-bit Linux machines.

XX:+UnlockExperimentalVMOptions

XX:+UseZGC
On the security side, TLS 1.3 support was added, cryptographical algorithms that lost their security were removed, and newer safer algorithms were added. Every message except the first one in the handshake is encrypted. Details at the link below.

[https://openjdk.java.net/jeps/332](https://openjdk.java.net/jeps/332)
Finally, [the Java 11 change list announced by Oracle is at this link.](https://www.oracle.com/technetwork/java/javase/11-relnote-issues-5012449.html)
