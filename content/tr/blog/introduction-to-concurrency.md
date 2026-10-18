---
title: "Concurrency – Aynı Anda Kullanım"
description: "Java'da eşzamanlı programlamaya (concurrency) giriş: thread kavramı ve temel yaklaşımlar."
date: 2011-06-13
tags: [concurrency, java]
translation: /en/blog/introduction-to-concurrency
---

Java’da “**Concurrency**” yani “**Aynı Anda Kullanım**” kavramı, aynı zamanda birden fazla iş yapmak gerektiği zaman kullanılır.
İki temel işlemi vardır;

1. Processes

2. Threads

Aslında hemen akla “**Threads**” gelir. Her bir “thread” başlıbaşına bir “process”tir. Yeni bir “thread” başlatmanın 2 tür yolu var; birincisi “**Runnable**” arayüzünden türetmek, ikincisi “**Thread**” nesnesinin alt sınıfı yapmak. Aşağıda 2 örnek de mevcut;
[java title=”<strong>1. Provide a Runnable object</strong>”]

public class HelloRunnable implements Runnable {
	@Override

	public void run() {

		System.out.println("Hello from a thread!");

	}
	public static void main(String args[]) {

		Thread t = new Thread(new HelloRunnable());

		t.start();

		System.out.println("ID: "+ t.getId());

		System.out.println("NAME: "+ t.getName());

	}

}

[/java]
[java title=”<strong>2. Subclass of Thread</strong>”]

public class HelloThread extends Thread {
	public void run() {

		System.out.println("Hello from a thread!");

	}
	public static void main(String[] args) {

		(new HelloThread()).start();
	}

}

[/java]
Her iki örnekte de görüldüğü üzere “**Thread.start()***” ifadesi ile thread çalışmaya başlıyor. Thread çalışmaya başlayınca “**run()**” metodunu tetikliyor.*
***Not:** *[http://download.oracle.com/javase/tutorial/essential/concurrency/index.html](http://download.oracle.com/javase/tutorial/essential/concurrency/index.html) adresinden faydalanılmıştır.**
**
**
