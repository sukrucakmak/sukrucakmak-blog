---
title: "Web Service Client"
description: "Steps for writing a web service client in Java."
date: 2011-07-01
tags: [java, web service]
translation: /blog/web-service-client
---

In a [previous post](https://www.sukrucakmak.com/2011/06/glassfish-uzerinde-web-servis/) I explained how to provide a web service on the GlassFish application server. But there are also clients that consume web services. In this post I'll try to explain how to create and run a client.
To create a **web service client** in Eclipse, I first open a standard Java project. Since the previous project was named "WebServiceGlassFish", I named this one "WebServiceGlassFishClient" — you're of course free to pick any name.

[![](/images/web-service-client-web-service-client-project.png)](/images/web-service-client-web-service-client-project.png)
After entering the project name, we click OK and create the project. Next comes creating the client: right-click the project and choose New > Web Service Client.

[![](/images/web-service-client-web-service-client.png)](/images/web-service-client-web-service-client.png)
On the next screen it asks for the client's address — that is, where the web service lives. I enter the address of the web service running on GlassFish as shown below; after a few seconds it detects it and the Next button and the others become active. We click OK.

[![](/images/web-service-client-web-service-client-definition.png)](/images/web-service-client-web-service-client-definition.png)
After these steps, Eclipse prepares a structure like the one below for us. The gist of it: it generates the classes that answer questions like where the web service is, which methods it has, what kind of parameters they take, and so on 🙂
[![](/images/web-service-client-web-service-client-project-structure.png)](/images/web-service-client-web-service-client-project-structure.png)
Now it's time to query the web service and get its response — for that I create a class named "**WebServiceTest**" with a "**main**" method under the "**org.sukru.webservices.test**" package.

[![](/images/web-service-client-web-service-client-test-class.png)](/images/web-service-client-web-service-client-test-class.png)
And inside the generated class I do the following in order;

1. I create a "service" to communicate with the web service.

2. I get a connection through the "service" and assign it to my HelloWorld object.

3. Eclipse warns me that the method might throw an exception if something goes wrong, so I add it.

4. Since the method I'll call on the web service — sayHello() — returns a String, I declare accordingly and invoke the web service.

```java
package org.sukru.webservices.test;
import org.sukru.webservices.HelloWorld;
import org.sukru.webservices.HelloWorldService;
import org.sukru.webservices.HelloWorldServiceLocator;
public class WebServiceTest {
	public static void main(String[] args) throws Exception {
		HelloWorldService service = new HelloWorldServiceLocator();
		HelloWorld port = service.getHelloWorldPort();
		String cevap = port.sayHello("Melih Sakarya");
		System.out.println("Web Servisinin Cevabı: "+ cevap );
	}
}
```
When we right-click and choose Run As > Java Application, if we see the output **Web Servisinin Cevabı: Merhaba Melih Sakarya!**, we can celebrate 🙂
Take it easy.
