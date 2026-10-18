---
title: "Web Service on GlassFish"
description: "Publishing a Java web service on the GlassFish application server."
date: 2011-06-28
tags: [application servers, glassfish, java, web service]
translation: /blog/web-service-on-glassfish
---

A web service ([Web Service](http://en.wikipedia.org/wiki/Web_service)) is one of the methods of communication between two devices.

There are multiple ways to develop a web service in Java. With the latest innovations, the "**[Annotations](http://en.wikipedia.org/wiki/Java_annotation)**" concept made this even easier — there's no need to generate a WSDL by hand; once you put the required annotation markers in place, the WSDL is generated on its own while the program runs.
[**GlassFish**](http://glassfish.java.net/) is, as you know, an open-source application server that's one of the cornerstones of JavaEE; its usage in the industry may be less than other servers, but it's one of the best known and — in my opinion — one of the easiest to use. Its admin console really simplifies management.
Now, for the web service example we'll build on GlassFish, the ingredients we need are;

- [GlassFish 3 application server](http://glassfish.java.net/)[![](/images/web-service-on-glassfish-glassfish_logo.png)](/images/web-service-on-glassfish-glassfish_logo.png)

- [Eclipse IDE for Java EE Developers](http://www.eclipse.org/downloads/)

Let's proceed step by step. The web service we'll build will simply answer "Merhaba {parameter}" ("Hello {parameter}") to the "String" parameter it receives.
Let's open a new "**Dynamic Web Project**" in Eclipse. As seen in the picture, I named it "**WebServiceGlassFish**".

[![](/images/web-service-on-glassfish-web-service-glassfish.png)](/images/web-service-on-glassfish-web-service-glassfish.png)
After clicking Next it asks where we write our source code; we click Next without touching anything, and the following screen appears — we specifically want it to generate web.xml.

[![](/images/web-service-on-glassfish-web-xml.png)](/images/web-service-on-glassfish-web-xml.png)
Time to code — let's now create our class and the methods we want to write. I create a new Java class inside the project, name it "**HelloWorld**", and write its package as "**org.sukru.webservices**".

[![](/images/web-service-on-glassfish-web-service-class.png)](/images/web-service-on-glassfish-web-service-class.png)
For a class to become a web service, the **@WebService()** annotation is placed at the top of the class, and the **@WebMethod()** annotation is placed on each method we want to expose as a web service method. OK, that's all you need to know — you may disperse 🙂 Joking aside, the example Java code is below…

```java
package org.sukru.webservices;
import javax.jws.WebMethod;

import javax.jws.WebService;
@WebService()

public class HelloWorld {
	@WebMethod()

	public String sayHello(String name) {

		System.out.println("Merhaba " + name);

		return "Merhaba" + name + "!";

	}

}
```
An additional thing to do is to declare the servlet in web.xml — I write the following code inside the web.xml created at the beginning.

```xml
<servlet>

	<display-name>HelloWorld</display-name>

	<servlet-name>HelloWorld</servlet-name>

	<servlet-class>org.sukru.webservices.HelloWorld</servlet-class>

</servlet>

<servlet-mapping>

	<servlet-name>HelloWorld</servlet-name>

	<url-pattern>/HelloWorld</url-pattern>

</servlet-mapping>
```
With this, I've registered that I have a servlet named HelloWorld, its URL info and where its class lives — so the application server can recognize our application.
Now we come to one of the important steps: deploying to GlassFish. We want to add a new server in Eclipse's Servers tab, but you won't find GlassFish in the standard list — that's why we follow Servers > New > Download Additional Adapters, select "**Oracle GlassFish Server Tools**" from the list that comes up, and after a short install Eclipse wants to restart; we say restart.
Now we can add it. There's an example below.

[![](/images/web-service-on-glassfish-eclipse-server-glassfish.png)](/images/web-service-on-glassfish-eclipse-server-glassfish.png)
We enter the GlassFish username and password.

[![](/images/web-service-on-glassfish-eclipse-server-glassfish-password.png)](/images/web-service-on-glassfish-eclipse-server-glassfish-password.png)
After the password screen it asks which applications to deploy to the server; we select our web service application. If a GlassFish server is already defined in your Eclipse, you can also just right-click the server and use "Add and Remove" to deploy only the application.
Finally we need to add GlassFish to the project's build path. Right-click the project, follow *Build Path > Configure Build-Path*, and add the server via Server Runtime.

[![](/images/web-service-on-glassfish-web-service-properties-add-glassfish-library.png)](/images/web-service-on-glassfish-web-service-properties-add-glassfish-library.png)
After that, start GlassFish and the application should now be running under GlassFish 🙂
We can see it in the GlassFish admin console (http://localhost:4848) — if you haven't changed it; after logging into the server we can click the "Applications" menu on the left to see the installed applications.

[![](/images/web-service-on-glassfish-glassfish-applications.png)](/images/web-service-on-glassfish-glassfish-applications.png)
As seen, the **WebServiceGlassFish** project is deployed under GlassFish — by the way, when you first add it under the server from within Eclipse, the console also prints whether it was deployed or not.
Now click "launch" on that screen, then append the **/HelloWorld** servlet name to the browser as shown below, and you'll get some information about the web service.

[![](/images/web-service-on-glassfish-glassfish-web-service-servlet.png)](/images/web-service-on-glassfish-glassfish-web-service-servlet.png)
Clicking the WSDL link gets you to the wsdl; mine looks like this.

[![](/images/web-service-on-glassfish-glassfish-web-service-wsdl.png)](/images/web-service-on-glassfish-glassfish-web-service-wsdl.png)
The web service is now ready to use. God willing, we'll test this web service in another post 🙂 (I did test it — it's just the writing it up that takes effort :D)
Take it easy.
