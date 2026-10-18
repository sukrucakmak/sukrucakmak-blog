---
title: "Log4j Configuration"
description: "Configuring Apache log4j: appender, layout, and log level settings."
date: 2011-06-27
tags: [java, logging]
translation: /blog/log4j-configuration
---

Apache log4j, as I mentioned in [this post](https://www.sukrucakmak.com/apache-log4j/), is a logging mechanism that gives us answers to these questions;

1. Who?

2. What?

3. When?

4. Where?

Now it's time to talk a bit about the basic concepts we need to know.
**Log Levels (LEVELS)**Although [TRACE](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#TRACE),

[DEBUG](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#DEBUG),

[INFO](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#INFO),

[WARN](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#WARN),

[ERROR](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#ERROR),

[FATAL](http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/Level.html#FATAL) exist, you can also write your own log level — but let me note that it's not recommended.
The ordering between levels is as follows: **`DEBUG < INFO < WARN < ERROR < FATAL`.**We'll understand better what this ordering is good for in the example below.
**Log Writers (APPENDERS)**It's possible to write logs to various targets; a few are listed below. I mostly write to file and the console.

- FileAppender

- ConsoleAppender

- SocketAppender

- SyslogAppender

- NTEventLogAppender

- SMTPAppender

**Layouts (LAYOUTS)**Contains info about how the log will look; where the time goes, where the method name goes, etc.

| Abbreviation | Meaning |
|---|---|
| %r | How much time was spent until logging started. |
| %t | Name of the thread that produced the log event. |
| %p | The log's level. |
| %c | The log's category — i.e. the package info of the class that produced it, etc. |
| %x | For some controls of the log. |
| %m | Message |
| %n | To move to a new line. |
| %L | Info about which line it was on. |
| %d | The time the log was produced. |

Now, with all this theoretical knowledge, I'll build a working application. I create a folder named "**config**" under my project and prepare the following file named "**log4j.xml**" inside it.
[xml]

<?xml version="1.0" encoding="UTF-8"?>

<!DOCTYPE log4j:configuration PUBLIC "-//LOGGER" "http://logging.apache.org/log4j/1.2/apidocs/org/apache/log4j/xml/doc-files/log4j.dtd">

<log4j:configuration>
 <appender name="stdout" class="org.apache.log4j.ConsoleAppender">

	<layout class="org.apache.log4j.PatternLayout">

		<param name="ConversionPattern" value="%d [%t] %5p %c{1}:%L – %m %n" />

	</layout>

  </appender>
 <root>

   <appender-ref ref="stdout" />

 </root>
</log4j:configuration>

[/xml]
Now let me explain the xml above a bit; when the program starts reading this xml it first looks under **root** and searches for an **appender** so it can write the log there. Ours has one named **stdout**; it goes and finds it among the **appenders**, understands ours is a **ConsoleAppender** — one that writes to the console — and writes to the **appender** according to its **pattern**. That's the story 🙂
Now let's unpack the pattern a bit;

- ***%d*** – Show the run time (I didn't give any formatter but you can write any *date format pattern* you like inside curly braces)

- ***[%t]*** – Show which thread is running, wrapped in "[" and "]" characters.

- ***%5p*** – Show the log's level.

- ***%c{1}*** – Show the log's category up to level 1. (Also try removing it 🙂 )

- ***%L*** – Show which line ran.

- ***%m*** – Write the message.

- ***%n*** – Write the next message on the line below.

Now let's use log4j. First let's write a class.
[java]

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

[/java]
Our test class for Log4j.
[java]

package org.sukru.log4j;
import org.apache.log4j.Logger;

import org.apache.log4j.xml.DOMConfigurator;
public class Log4jTest {
  private static Logger logger;
  public static void main(String[] args) {

	configureLog4j();   // I wrote this method to bring log4j up.

	logger.info("Initializing a new Student…");

	Student student = new Student(100L, "Tuncay", "Uzun");

	logger.info("new Student initialized: "+student.getFirstName()+" "+student.getLastName());

  }
  private static void configureLog4j() {

	DOMConfigurator.configureAndWatch("config/log4j.xml");   // we give the location of the log4j configuration file in the project.

	logger = Logger.getLogger(Log4jTest.class);

  }

}

[/java]
Let's see what kind of log we got — I think it's pretty self-explanatory 🙂
[shell]
2011-06-27 14:42:19,507 [main]  INFO Log4jTest:12 – Initializing a new Student…

2011-06-27 14:42:19,511 [main]  INFO Log4jTest:14 – new Student initialized: Tuncay Uzun
[/shell]
Now let's play with the xml file a bit and write the following expression under **root** to pull our log level from **info** down to the less verbose **warn**. (I wrote the ordering above 😉 )

[xml]<level value="warn" />[/xml]

If we run it again now, we see that no log is written 🙂 That is, with a single expression in the xml we made the log level of the entire project **warn** and prevented our **info** logs from being written; only **warn** and above messages, if any, will be seen 😉
Take it easy.
