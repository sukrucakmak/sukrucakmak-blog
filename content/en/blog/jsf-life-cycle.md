---
title: "JSF Life Cycle"
description: "The 6 steps of the JSF life cycle: from processing the request to rendering the response."
date: 2011-06-28
tags: [java, jsf]
translation: /blog/jsf-life-cycle
---

In this post I'll try to explain what kind of life the [JSF framework](http://tr.wikipedia.org/wiki/JavaServer_Faces) ([JavaServer Faces Framework](http://en.wikipedia.org/wiki/JavaServer_Faces)) leads 🙂 Goes to bed late, wakes up late, and apparently drinks too... Joking aside, when I first started with JSF I was very curious about what it does between the moment we take an action on a web page and the moment it shows us the result, and how it responds to us — I even searched around and couldn't understand it, because there was hardly any resource explaining it clearly, and the ones that existed didn't speak my language (I was looking for a folksy explanation 🙂 ).

> A JSF request is processed in 6 steps.

This image I took from the [JSF reference book](http://jsfcompref.appspot.com/) illustrates it. I'll walk through each step.

[![jsf-life-cycle](/images/jsf-life-cycle-jsf-life-cycle.png)](/images/jsf-life-cycle-jsf-life-cycle.png)
Now let's list these steps;

1. Create or Restore View

2. Apply Values from User

3. Ensure Values are Valid

4. Update Model with Valid Values

5. Fetch a New View, If Necessary

6. Render View

***1. Create or Restore View***

The moment we open a JSF application, the components of the page we see are created. The user then performs a "submit" action — usually through a button, though other methods exist via Ajax.
***2. Apply Values from User***

The values entered by the user are picked up in this "Apply Values" phase.
***3. Ensure Values are Valid***

In this phase the values entered by the user are checked: whether they match the criteria, whether required fields are filled in, and so on. If everything is fine it moves to the next phase; otherwise it goes back to the first phase. For instance, we asked for only numbers in a field but the user typed letters, or we made a field required but the user submitted the form without providing a value…
***4. Update Model with Valid Values***

After the data has been validated in the previous phase, it's now the model's turn (bean, entity, etc.) to be updated — that is, the data obtained from the form is applied to it. Like the value entered in the "name" field of the form being assigned to the "name" field of the "Student" class…
***5. Fetch a New View, If Necessary***

If the form's actions result in a need for a new view, it creates that view.
***6. Render View***

Finally, this phase runs to render the web page back to the user.
Broadly speaking, that's the life JSF leads — seems reasonable so far, don't you think 🙂
