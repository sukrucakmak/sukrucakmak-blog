---
title: "Apache log4j"
description: "An introduction to the Apache log4j logging framework in Java: core concepts, log levels, and usage."
date: 2011-06-27
tags: [java, logging]
translation: /blog/apache-log4j
---

[Apache log4j](http://logging.apache.org/log4j/) is a Java-based **logging** mechanism. It's loved in the industry and handy. Integrating it into projects and using it is fairly easy.

![Apache log4j](http://logging.apache.org/log4j/2.x/images/logo.jpg)

What we need to do;

- [download the jar file](http://logging.apache.org/log4j/1.2/download.html) and add it to our project's libraries

- point the project build path at this jar.

After these steps we're ready to work with log4j. As an example I'll write a "**Student**" class and try logging it. The application will be very basic — so basic that, although there are normally 2 ways of configuring log4j;

1. by preparing a property file

2. by preparing an XML file

I'll bring log4j up without any file at all, using the "***configure()***" method of the "**BasicConfigurator**" class provided by log4j.

```java
package org.sukru.log4j;
public class Student {
	private Long studentNumber;
	private String firstName;
	private String lastName;
	public Student(Long studentNumber, String firstName, String lastName) {
		this.studentNumber = studentNumber;
		this.firstName = firstName;
		this.lastName = lastName;
	}
	// getters and setters
}
```
Let's also write the test class where we bring log4j up and use it.
```java
package org.sukru.log4j;
import org.apache.log4j.BasicConfigurator;
import org.apache.log4j.Logger;
public class Log4jTest {
	public static void main(String[] args) {
		BasicConfigurator.configure(); // let's bring log4j up.
		Logger logger = Logger.getLogger(Student.class); // let's specify which class to track.
		logger.info("Initializing new Student…");
		Student student = new Student(100L, "Yunus Emre", "Aslan");
		logger.info("new Student initialized: "+student.getFirstName()+" "+student.getLastName());
	}
}
```
When we run this class the output will look like this.
```bash
0 [main] INFO org.sukru.log4j.Student  – Initializing a new Student…

2 [main] INFO org.sukru.log4j.Student  – new Student initialized: Yunus Emre Aslan
```
I used the "**info(Object message)**" method for informational purposes, but depending on the need and the goal the following methods can be used;

- fatal()

- error()

- warn()

- debug()

- trace()

- info()

I'll explain the other configuration methods in another post. I think this is enough for an introduction. Take it easy.
