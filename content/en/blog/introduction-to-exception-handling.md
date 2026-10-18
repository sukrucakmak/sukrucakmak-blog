---
title: "Introduction to Exception Handling"
description: "An introduction to exception handling in Java: the try-catch mechanism and the checked/unchecked distinction."
date: 2011-07-26
tags: [exceptions, java]
translation: /blog/introduction-to-exception-handling
---

In Java, the concept of "exceptions" is used for catching errors and handling exceptional situations. It's essential for robust software, yet it's often neglected. Let's not neglect it.
An "exception" is an event that interrupts the normal flow of a program's execution. In the picture below we see a flow going up from the "main" method, and at the last step an error occurs. From the point where the error happened, the code starts looking for a part that can handle it (exception handler), this time in reverse order. Once it finds the exception handler, it passes the error to the appropriate handler.
[![](/images/introduction-to-exception-handling-exceptions-callstack.gif)](/images/introduction-to-exception-handling-exceptions-callstack.gif)
We call these operations catching the exception.
[![](/images/introduction-to-exception-handling-exceptions-errorOccurs.gif)](/images/introduction-to-exception-handling-exceptions-errorOccurs.gif)
Exception handling can be done:

- by catching it inside a `try` code block, or

- by declaring it with a `throws` clause at the method signature.

> There are 3 types of errors;

> 1. Checked Exception

> 2. Error

> 3. Runtime Exception

**1. Checked Exception**

For example, you're reading a file using an object of the `java.io.FileReader` class; you give it a filename and it can't find the file, so it throws a `java.io.FileNotFoundException`. In a well-written program you catch this in a try-catch block, inform the user about the error, and let them fix the filename.
Every situation other than "Error" or "Runtime Exception" is a "Checked Exception".
**2. Error**

These are situations caused by external systems outside your application. For example, you want to read a file but your file system — say the disk — can't be reached; that's where an "Error" type situation occurs, and the application throws a `java.io.IOError`.
**3. Runtime Exception**

This is a situation that occurs while your application is running. It stems from the application itself — it's a bug in the program, a logic error, or a result of misusing the API 🙂 And yes, I've done it like everyone else, and I've usually gotten a `NullPointerException` — that's why 🙂
To make it clearer with an example: you want to read a file but didn't provide a filename — well, what happens? You'll get a `NullPointerException`. That is, the application will have "blown up" at runtime — as they usually say.
By the way, "Error" and "Runtime Exception" together are also called "Unchecked Exceptions".
I think this much information is enough as an introduction — enough for it to stick in your mind. In my next post on this topic we'll write plenty of code 🙂
Take it easy.
**Resources**

1. http://download.oracle.com/javase/tutorial/essential/exceptions/

2. http://tutorials.jenkov.com/java-exception-handling/index.html
