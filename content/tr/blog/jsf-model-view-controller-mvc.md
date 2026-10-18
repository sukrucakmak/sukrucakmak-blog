---
title: "JSF Model-View-Controller (MVC)"
description: JSF'in MVC mimarisini nasıl uyguladığı: model, view ve controller ayrımı.
date: 2011-07-05
tags: [java, jsf]
---

Yeni nesil Internet uygulamalarında karşımıza çıkan ilk kavramlardan biri, **MVC**açılımı **Model-View-Controller**. JSF de kendine örnek olarak MVC yapısını baz almaktadır.

1. **Model** – Java sınıflarımız

2. **View** – Görsel Sayfalarımız, önyüzümüz

3. **Controller** – Servlet (Faces Servlet) olarak görülebilir.

[JSF Referans kitabı](http://jsfcompref.appspot.com/)nda konu ile alakalı şu resim olayı betimliyor.

[![](/images/jsf-model-view-controller-mvc-jsf-mvc-demonstration.png)](/images/jsf-model-view-controller-mvc-jsf-mvc-demonstration.png)
Resimdeki örnek projeye göre daha da açarsak; **Model** katmanında Java Beans bulunurken (User.java, Account.java, Item.java, ShoppingCart.java, vb…), **View** katmanında xhtml sayfalarımız (showUser.xhtml, purchase.xhtml, editUser.xhtml vb…) bulunur ve bu sayfalar son kullanıcının gördüğü görsel sayfalardır. Tabi temelde işleri yöneten de **Controller**dediğimiz *Faces Servlet*tir. Faces Servlet kavramını çok açmıyorum, JSF’in derinlerine başka bir yazıda inip inceleriz.
Sözün özü, kurumsal uygulamalarda (Java için JavaEE) katmanlar birbirinden ayrılmıştır. Sunum katmanı (View) son kullanıcıya yönelik, arka plana iş veren, görsel bir pozisyon üstlenirken, arka plandaki iş mantığını yapan (Model) ayrı bir katman olarak bulunmakta ve bunları da yöneten, kontrol eden (Controller) bir başka katman bulunmaktadır.
Yazılım dili bağımsız bir kavram olan MVC’yi, sanıyorum ki Java bilsin bilmesin herkes temelde bu gösterimle anlayabilir. 🙂 Anlamayan iletişime geçsin.
Kolay gelsin.
