---
title: "Spring Security + PrimeFaces Yönlendirme Problemi Çözümü"
description: Spring Security ile PrimeFaces kullanılırken ortaya çıkan yönlendirme probleminin çözümü.
date: 2015-05-15
tags: [java, jsf, primefaces, spring]
---

Spring Security, Java EE dünyasında kabul görmüş ve java uygulamaları için -bence- güvenlik için bulunmaz bir nimet. Ayrıntılı bilgiye [sitesinden ulaşabilirsiniz](http://projects.spring.io/spring-security/).

PrimeFaces da JSF dünyasında kabul gören en başarılı bileşen kütüphanesi, yine bu adresten [detaylı bilgiye ulaşabilirsiniz](http://www.primefaces.org).
JSF 2.2 + Spring 4 + Hibernate 4 + PrimeFaces 5 şeklinde altyapısını kurguladığım projemde fark ettim ki başarılı bir giriş (login) işlemi sonrası sayfa gitmesi gereken URL’e gitmiyor. Spring Security loglarını incelediğimde ise herhangi bir problem olmadan “**[sendRedirect](https://tomcat.apache.org/tomcat-5.5-doc/servletapi/javax/servlet/http/HttpServletResponse.html#sendRedirect(java.lang.String))**” ile konfigürasyondaki belirttiğim URL’e gönderiyor. Her şeyin bu kadar mükemmel olduğu yerde nasıl olur da bu çalışmaz diye kafayı sıyırdım tabi ki 🙂
Spring Security logu aşağıdaki gibi. /login sayfasından istediğim gibi /pages/home sayfasına yönlendirmiş.
[shell][DEBUG] ..access.intercept.FilterSecurityInterceptor – Authorization successful

[DEBUG] ..security.web.FilterChainProxy            – /pages/home.xhtml reached end of additional filter chain; proceeding with original chain

[DEBUG] ..web.access.ExceptionTranslationFilter    – Chain processed normally

[DEBUG] ..web.context.SecurityContextPersistenceFilter – SecurityContextHolder now cleared, as request processing completed[/shell]
Başladım daha detaylı incelemeye, önce tarayıcı üzerinde gelen-giden akışı izledim.
**İstek (Request):**

[text]javax.faces.partial.ajax:true

javax.faces.source:loginButton

javax.faces.partial.execute:loginForm

javax.faces.partial.render:loginForm

loginButton:loginButton

loginForm:loginForm

username:test

password:123456

_csrf:49756ca7-38fd-4777-bea8-58fcfe7deb73

javax.faces.ViewState:-3601270081246135757:6121484162719565648[/text]
**Yanıt (Response):**

[text]xml version='1.0' encoding='UTF-8'?
-6140875972550706628:-2367790204853062502[/text]
Bunları görünce tabi ki [“Aman Tanrım didim”](https://www.youtube.com/watch?v=gbnhydOczwI), neden mi? 🙂

Çünkü gelen yanıtta “redirect-url” yok! Sadece “update” var! Yani ajax işinde hata yapmışız (javax.faces.partial.ajax:true) ve bunu aşmak için önümüzde iki yol var;

1. Primefaces commandButton özelliklerinde ajax=”false” demek

2. Primefaces butonu yerine klasik JSF butonu kullanmak

Kullandığım buton
[xml][/xml]
1. yol

[xml]

[/xml]
2. yol (primefaces butonunun css’inden faydalanamazsınız, elle eklemeniz lazım)

[xml]

[/xml]
Sonuç olarak bu kadar basit görünse de tarayıcı üzerindeki trafiği izlemeden ben anlayamadım. Bu arada tüm tarayıcılarda neredeyse standart haline geldi, “Developer Tools” deniliyor genelde ve F12 tuşu ile açabiliyorsunuz, bilmeyenler olabilir diye bahsedeyim dedim.
Bunların dışında Spring Security’nin “sendRedirect” yaptığı yeri ezerek (override) de bu işi yapabilirdik ama daha maliyetli olurdu. Nasıl yapılabileceği [şuradaki cevapta](http://stackoverflow.com/questions/9305144/using-jsf-2-0-facelets-is-there-a-way-to-attach-a-global-listener-to-all-ajax/9311920#9311920) üstad BalusC tarafından verilmiş 🙂
Sorunun temeline de [şu kaynaktan bakılabilir.](http://stackoverflow.com/questions/10954319/jsf-2-response-sendredirect-is-not-working)
