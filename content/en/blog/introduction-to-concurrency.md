---
title: "Concurrency"
description: "An introduction to concurrent programming in Java: the thread concept and the basic approaches."
date: 2011-06-13
tags: [concurrency, java]
translation: /blog/introduction-to-concurrency
---

In Java, "**Concurrency**" is the concept used when you need to do multiple things at the same time.
It has two basic operations;

1. Processes

2. Threads

What immediately comes to mind is "**Threads**". Each "thread" is a "process" in its own right. There are 2 ways to start a new "thread"; the first is to implement the "**Runnable**" interface, the second is to subclass the "**Thread**" object. Both examples are below;
```java
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
```
```java
public class HelloThread extends Thread {
	public void run() {

		System.out.println("Hello from a thread!");

	}
	public static void main(String[] args) {

		(new HelloThread()).start();
	}

}
```
As seen in both examples, the thread starts running with the "**Thread.start()***" call. Once it starts, it triggers the "**run()**" method.*
***Note:*** *Based on [http://download.oracle.com/javase/tutorial/essential/concurrency/index.html](http://download.oracle.com/javase/tutorial/essential/concurrency/index.html).**
**
**
