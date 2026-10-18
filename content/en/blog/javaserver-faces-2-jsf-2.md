---
title: "JavaServer Faces 2 (JSF 2)"
description: "An introduction to JavaServer Faces 2: the fundamentals of component-based web development."
date: 2011-09-02
tags: [java, jsf]
translation: /blog/javaserver-faces-2-jsf-2
---

JavaServer Faces (JSF) has been accepted by the Java Committee as the standard web technology. Anyone who wants to do web programming with Java is recommended to learn it. You can find detailed info at [http://javaserverfaces.java.net/](http://javaserverfaces.java.net/).
Since JSF is based on Model-View-Controller (MVC), our Java classes and our visual pages — the front end — live in separate layers. I explained this topic in detail [on this page](https://www.sukrucakmak.com/jsf-model-view-controller-mvc/).
Now let's build our first application with JSF 2. We need the following ingredients — or rather, these are the ones I'll be using;

- [Eclipse Java EE IDE for Web Developers (Helios)](http://www.eclipse.org/downloads/)

- [Apache Tomcat 7](http://tomcat.apache.org/download-70.cgi)

- [JSF 2 Libraries (jsf-api.jar and jsf-impl.jar)](http://javaserverfaces.java.net/)

**Tomcat**

Let's start Eclipse and open a new workspace. First let's register the "Server". After right-clicking in the Server tab and following **New > Server**, you can point at Tomcat's location as shown below.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-12.55.44-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-12.55.44-PM.png)
**Creating the Project**

Now in the "Package Explorer" or "Project Explorer" view, we create the project via **New > Dynamic Web Project** as shown below. First we fill in fields like the project name.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-1.00.59-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-1.00.59-PM.png)
Then by clicking Next and Next again we make it generate the "web.xml" file as shown below, and hit the "finish" button.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-2.53.42-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-2.53.42-PM.png)
**Required Jars for JSF 2**

There are a few steps we need to take for our JSF 2 application to run; first, let's copy the 2 jar files we mentioned at the beginning into the **WEB-INF/lib** directory — our project should look like the one below.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-06-at-11.43.46-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-06-at-11.43.46-PM.png)
**web.xml Settings**

For our JSF 2 application to be interpreted by the server we need to add the following lines into web.xml.
[xml]

        <!– Faces Servlet –>

	<servlet>

		<servlet-name>Faces Servlet</servlet-name>

		<servlet-class>javax.faces.webapp.FacesServlet</servlet-class>

		<load-on-startup> 1 </load-on-startup>

	</servlet>
	<!– Faces Servlet Mapping –>

	<servlet-mapping>

		<servlet-name>Faces Servlet</servlet-name>

		<url-pattern>*.jsf</url-pattern>

	</servlet-mapping>

[/xml]
After adding these lines, web.xml will look like the one below.
[xml]

<?xml version="1.0" encoding="UTF-8"?>

<web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"

	xmlns="http://java.sun.com/xml/ns/javaee" xmlns:web="http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd"

	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd"

	id="WebApp_ID" version="2.5">

	<display-name>jsf2-helloworld</display-name>
	<!– Faces Servlet –>

	<servlet>

		<servlet-name>Faces Servlet</servlet-name>

		<servlet-class>javax.faces.webapp.FacesServlet</servlet-class>

		<load-on-startup> 1 </load-on-startup>

	</servlet>
	<!– Faces Servlet Mapping –>

	<servlet-mapping>

		<servlet-name>Faces Servlet</servlet-name>

		<url-pattern>*.jsf</url-pattern>

	</servlet-mapping>
	<welcome-file-list>

		<welcome-file>index.html</welcome-file>

	</welcome-file-list>

</web-app>

[/xml]
**Creating an xhtml Page**

Now all our infrastructure preparations are done — time to create a page and run it. We create a file named index.xhtml under the WebContent directory and edit it as below.
[html]

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml"

	xmlns:h="http://java.sun.com/jsf/html"

	xmlns:f="http://java.sun.com/jsf/core"

	xmlns:ui="http://java.sun.com/jsf/facelets">

<h:head>

	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />

	<title>jsf2-helloworld</title>

</h:head>

<h:body>
	Merhaba JSF 2
</h:body>

</html>

[/html]
**Running the Project**

We add our project under Tomcat via **Add and Remove** in Tomcat's menu.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-3.37.24-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-3.37.24-PM.png)
Then we start Tomcat. If you haven't made any port changes, going to [http://localhost:8080/jsf2-helloworld/index.jsf](http://localhost:8080/jsf2-helloworld/index.jsf) shows us the screen below.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-3.42.01-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-3.42.01-PM.png)
We now have a JSF 2 application in its purest form. In the next lesson we'll add the [PrimeFaces](http://www.primefaces.org/) component suite to this application. We'll enrich the application beyond its plain form with the components PrimeFaces provides.
Take it easy.
