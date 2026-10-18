---
title: "JavaServer Faces 2 (JSF 2)"
date: 2011-09-02
tags: [java, jsf]
---

JavaServer Faces (JSF), Java Komitesi tarafından standart web teknolojisi olarak kabul edilmiştir. Java ile web programlama yapmak isteyen bir kişinin mutlaka öğrenmesi tavsiye edilir. Ayrıntılı bilgiye [http://javaserverfaces.java.net/](http://javaserverfaces.java.net/) adresinden erişebilirsiniz.
JSF, Model-View-Controller (MVC) tabanlı olduğundan Java sınıflarımız ile görsel sayfalarımız yani önyüzümüz farklı farklı katmanlarda bulunmaktadır. Bu konuyu detaylı bir şekilde [şu sayfada](https://www.sukrucakmak.com/jsf-model-view-controller-mvc/) anlatmıştım.
Şimdi JSF 2 ile ilk uygulamamızı yapalım. Bize aşağıdaki malzemeler lazım daha doğrusu ben bunları kullanacağım;

- [Eclipse Java EE IDE for Web Developers (Helios)](http://www.eclipse.org/downloads/)

- [Apache Tomcat 7](http://tomcat.apache.org/download-70.cgi)

- [JSF 2 Libraries (jsf-api.jar ve jsf-impl.jar)](http://javaserverfaces.java.net/)

**Tomcat**

Eclipse başlatıp yeni bir çalışma alanı (workspace) açalım. İlk olarak “Server”ı tanıtalım. Server tabında sağ tıklayarak **New > Server** yolunu takip ettikten sonra Tomcat’in yerini aşağıdaki gibi gösterebilirsiniz.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-12.55.44-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-12.55.44-PM.png)
**Proje Oluşturma**

Şimdi “Package Explorer” ya da “Project Explorer” görünümünde **New > Dynamic Web Project** yolu ile aşağıdaki gibi projeyi oluşturuyoruz. Önce proje ismi gibi alanları dolduruyoruz.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-1.00.59-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-1.00.59-PM.png)
Sonra ileri ve tekrar ileri diyerek aşağıdaki gibi “web.xml” dosyasını oluşturmasını sağlayıp “finish” butonuna basarız.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-2.53.42-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-2.53.42-PM.png)
**JSF 2 için Gerekli Jarlar**

JSF 2 uygulamamızın çalışması için yapmamız gereken bir kaç adım var, ilk olarak en başta belirttiğimiz 2 adet jar dosyasını **WEB-INF/lib** dizini altına kopyalayalım, projemizin görünümü aşağıdaki gibi olmalı.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-06-at-11.43.46-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-06-at-11.43.46-PM.png)
**web.xml Ayarları**

JSF 2 uygulamamızın server tarafından yorumlanabilmesi için web.xml içine şu satırları eklememiz lazım.
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
Bu satırları ekledikten sonra web.xml dosyasının görünümü aşağıdaki gibi olacaktır.
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
**xhtml Sayfası Oluşturmak**

Artık tüm altyapı hazırlıklarımız tamam, sıra geldi bir sayfa oluşturup çalıştırmaya. WebContent dizini altına index.xhtml adında bir dosya oluşturup aşağıdaki gibi düzenliyoruz.
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
**Projenin Çalıştırılması**

Tomcat’in menüsünden **Add and Remove** aracılığı ile projemizi Tomcat altına ekliyoruz.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-3.37.24-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-3.37.24-PM.png)
Daha sonra Tomcat’i başlatıyoruz. Herhangi bir port değişikliği yapmadıysanız [http://localhost:8080/jsf2-helloworld/index.jsf](http://localhost:8080/jsf2-helloworld/index.jsf) bağlantısına gidince karşımıza aşağıdaki ekran gelir.
[![](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-3.42.01-PM.png)](/images/javaserver-faces-2-jsf-2-Screen-Shot-2011-09-02-at-3.42.01-PM.png)
En saf haliyle bir JSF 2 uygulamasına sahibiz. Bundan sonraki derste bu uygulamamıza, [PrimeFaces](http://www.primefaces.org/) component suite eklemesi yapacağız. Uygulamayı sade halinden PrimeFaces’ın sağladığı bileşenlerle zenginleştireceğiz.
Kolay gelsin.
