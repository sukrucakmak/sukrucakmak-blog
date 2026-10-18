---
title: "JSF 2 + PrimeFaces"
description: "JSF 2 üzerinde PrimeFaces bileşen kütüphanesiyle zengin kullanıcı arayüzleri geliştirmek."
date: 2011-09-05
tags: [java, jsf]
translation: /en/blog/jsf-2-primefaces
---

[PrimeFaces](http://www.primefaces.org), JSF 2 için yazılmış bileşen kütüphanelerinin en başında gelmektedir. Şu an itibariyle de [NetBeans](http://www.netbeans.org) geliştirme ortamında hazır gelen tek bileşen kütüphanesidir. Gelişmiş bir çok bileşenini ve detaylarını [demo sayfalarında](http://www.primefaces.org/showcase/) bulabilirsiniz.
**Bu yazıya başlamadan önce…**
Daha önce yazmış olduğum şu yazıları, bu makaleye başlamadan önce okumanızı tavsiye ederim.

1. [JSF Life Cycle](https://www.sukrucakmak.com/jsf-life-cycle/)

2. [JSF Model-View-Controller](https://www.sukrucakmak.com/jsf-model-view-controller-mvc/)

3. [JSF 2’ye Giriş](https://www.sukrucakmak.com/javaserver-faces-2-jsf-2/)

Konular hakkında bilgili olanlar tabi ki okumasına gerek yok, lakin JSF 2’ye giriş yazısında oluşturduğumuz geliştirme ortamı üzerinden bu yazıya devam edeceğim için, en azından ona bakmanızda fayda var.
**PrimeFaces ile Güçlenmek**
JSF 2 projemizi PrimeFaces ile güçlendirmek sadece iki adımdan oluşmaktadır.

1. PrimeFaces [indirme sayfasından](http://www.primefaces.org/downloads.html) en son kararlı sürümü indirmek ve projenin kütüphaneleri arasına eklemek

2. xhtml sayfalarının başındaki xmlns tanımları arasına aşağıdaki satırı eklemek.

```
xmlns:p="http://primefaces.org/ui"
```

![](/images/jsf-2-primefaces-Screen-Shot-2011-09-06-at-11.50.52-PM.png)

Evet, sadece bu kadar! Bundan sonra sayfalarımız içinde
Görüldüğü üzere **index.xhtml** sayfası içerisine bileşenini eklemiş bulunmaktayız. Projeyi çalıştırıp **index.jsf** sayfasını çalıştırdığımızda aşağıdaki gibi bir görümüne sahip oluruz.

[![](/images/jsf-2-primefaces-Screen-Shot-2011-09-03-at-2.12.37-PM.png)](/images/jsf-2-primefaces-Screen-Shot-2011-09-03-at-2.12.37-PM.png)

Bir sonraki yazıda bu JSF 2 + PrimeFaces uygulamamızı Ajax kullanarak geliştireceğiz.
Kolay gelsin.

```

```
