---
title: "Fixing the Spring Security + PrimeFaces Redirect Issue"
description: "The fix for the redirect problem that appears when using Spring Security with PrimeFaces."
date: 2015-05-15
tags: [java, jsf, primefaces, spring]
translation: /blog/spring-security-primefaces-redirect-issue-fix
---

Spring Security is a well-established name in the Java EE world and — in my opinion — a godsend for securing Java applications. You can find detailed info [on its site](http://projects.spring.io/spring-security/).

PrimeFaces is also the most successful component library recognized in the JSF world; again, [detailed info is at this address](http://www.primefaces.org).
In my project built on JSF 2.2 + Spring 4 + Hibernate 4 + PrimeFaces 5, I noticed that after a successful login the page didn't navigate to the URL it was supposed to. When I examined the Spring Security logs, there was no problem at all — it was sending the request to the URL I specified in the configuration via "**[sendRedirect](https://tomcat.apache.org/tomcat-5.5-doc/servletapi/javax/servlet/http/HttpServletResponse.html#sendRedirect(java.lang.String))**". In a place where everything was this perfect, of course I went nuts trying to figure out how it could not work 🙂
The Spring Security log looks like this. It redirected from the /login page to /pages/home just as I wanted.
```bash
[DEBUG] ..access.intercept.FilterSecurityInterceptor – Authorization successful

[DEBUG] ..security.web.FilterChainProxy            – /pages/home.xhtml reached end of additional filter chain; proceeding with original chain

[DEBUG] ..web.access.ExceptionTranslationFilter    – Chain processed normally

[DEBUG] ..web.context.SecurityContextPersistenceFilter – SecurityContextHolder now cleared, as request processing completed
```
I started digging deeper — first I watched the request/response flow in the browser.

**Request:**

```text
javax.faces.partial.ajax:true

javax.faces.source:loginButton

javax.faces.partial.execute:loginForm

javax.faces.partial.render:loginForm

loginButton:loginButton

loginForm:loginForm

username:test

password:123456

_csrf:49756ca7-38fd-4777-bea8-58fcfe7deb73

javax.faces.ViewState:-3601270081246135757:6121484162719565648
```

**Response:**

```text
xml version='1.0' encoding='UTF-8'?
-6140875972550706628:-2367790204853062502
```
When I saw these, of course [I said "Oh my God"](https://www.youtube.com/watch?v=gbnhydOczwI) — why? 🙂

Because there's no "redirect-url" in the response! There's only an "update"! So we made a mistake in the Ajax part (javax.faces.partial.ajax:true), and there are two ways around it;

1. Setting ajax="false" in the PrimeFaces commandButton attributes

2. Using a classic JSF button instead of the PrimeFaces button

The button I was using
```xml

```
Option 1

```xml

```
Option 2 (you can't benefit from the PrimeFaces button's CSS here — you'd have to add it manually)

```xml

```
In the end it looks this simple, but I couldn't figure it out without watching the traffic in the browser. By the way, it's become nearly standard in all browsers — it's usually called "Developer Tools" and you can open it with F12; I wanted to mention it in case some don't know.
Besides these, we could have done this by overriding the place where Spring Security calls "sendRedirect", but that would be more costly. How to do it was given in [this answer](http://stackoverflow.com/questions/9305144/using-jsf-2-0-facelets-is-there-a-way-to-attach-a-global-listener-to-all-ajax/9311920#9311920) by the master BalusC 🙂
For the root of the problem, [see this resource.](http://stackoverflow.com/questions/10954319/jsf-2-response-sendredirect-is-not-working)
