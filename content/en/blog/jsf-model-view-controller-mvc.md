---
title: "JSF Model-View-Controller (MVC)"
description: "How JSF applies the MVC architecture: the split between model, view, and controller."
date: 2011-07-05
tags: [java, jsf]
translation: /blog/jsf-model-view-controller-mvc
---

One of the first concepts you run into with modern web applications is **MVC** — **Model-View-Controller**. JSF also builds on the MVC pattern.

1. **Model** – our Java classes

2. **View** – our visual pages, the front end

3. **Controller** – can be seen as the servlet (Faces Servlet).

The following image from the [JSF reference book](http://jsfcompref.appspot.com/) illustrates it well.

[![](/images/jsf-model-view-controller-mvc-jsf-mvc-demonstration.png)](/images/jsf-model-view-controller-mvc-jsf-mvc-demonstration.png)
Expanding on the sample project in the picture: the **Model** layer holds the Java Beans (User.java, Account.java, Item.java, ShoppingCart.java, etc.), the **View** layer holds our xhtml pages (showUser.xhtml, purchase.xhtml, editUser.xhtml, etc.) — the visual pages the end user sees — and underneath it all, the *Faces Servlet* we call the **Controller** manages the work. I won't dig deeper into Faces Servlet here; that's a topic for another post where we dive into JSF internals.
In short, in enterprise applications (JavaEE for Java) the layers are separated: the presentation layer (View) faces the end user and delegates work to the back end, the business logic lives in a separate layer (Model), and another layer (Controller) manages and coordinates them.
MVC is a language-independent concept, and I believe anyone — whether they know Java or not — can grasp it from this illustration. 🙂 If not, get in touch.
Take it easy.
