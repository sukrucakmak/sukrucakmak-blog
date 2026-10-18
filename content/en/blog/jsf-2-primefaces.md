---
title: "JSF 2 + PrimeFaces"
description: "Building rich user interfaces on JSF 2 with the PrimeFaces component library."
date: 2011-09-05
tags: [java, jsf]
translation: /blog/jsf-2-primefaces
---

[PrimeFaces](http://www.primefaces.org) is the leading component library written for JSF 2. As of now it's also the only component library bundled with the [NetBeans](http://www.netbeans.org) IDE. You can find many of its advanced components and details on the [showcase pages](http://www.primefaces.org/showcase/).
**Before starting this post…**
I recommend reading the following posts I wrote earlier before diving into this article.

1. [JSF Life Cycle](https://www.sukrucakmak.com/jsf-life-cycle/)

2. [JSF Model-View-Controller](https://www.sukrucakmak.com/jsf-model-view-controller-mvc/)

3. [Introduction to JSF 2](https://www.sukrucakmak.com/javaserver-faces-2-jsf-2/)

If you already know these topics you don't need to read them, but since I'll continue this post on the development environment we set up in the JSF 2 introduction, it's worth at least taking a look at that one.
**Powering Up with PrimeFaces**
Powering up our JSF 2 project with PrimeFaces takes only two steps.

1. Download the latest stable release from the PrimeFaces [download page](http://www.primefaces.org/downloads.html) and add it to the project's libraries.

2. Add the following line to the xmlns declarations at the top of your xhtml pages.

```
xmlns:p="http://primefaces.org/ui"
```

![](/images/jsf-2-primefaces-Screen-Shot-2011-09-06-at-11.50.52-PM.png)

Yes, that's all! From now on we can use PrimeFaces components inside our pages.
As you can see, we've added the component inside the **index.xhtml** page. When we run the project and open the **index.jsf** page we get something like the following.

[![](/images/jsf-2-primefaces-Screen-Shot-2011-09-03-at-2.12.37-PM.png)](/images/jsf-2-primefaces-Screen-Shot-2011-09-03-at-2.12.37-PM.png)

In the next post we'll enhance this JSF 2 + PrimeFaces application using Ajax.
Take it easy.
