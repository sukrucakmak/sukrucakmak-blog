---
title: "Generic Types"
description: "Why generic types emerged in Java and how they protect us from ClassCastExceptions."
date: 2011-07-08
tags: [generics, java]
translation: /blog/generic-types
---

In programming, sometimes the types of certain values can't be predicted. While you expect the incoming value to be an `Integer`, lo and behold a `String` arrives; your application gets a `java.lang.ClassCastException` saying `java.lang.String cannot be cast to java.lang.Integer`, meaning the incoming String value couldn't be converted to Integer.
That's exactly where the **Generic Types** concept comes in.
Now, to demonstrate what I described above, here's an example where we run into the error. There's a class named Box that has a variable of type Object.
[java]

package org.sukru.classic;
public class Box {
	private Object object;
	public void add(Object object) {

		this.object = object;

	}
	public Object get() {

		return object;

	}

}

[/java]
Whatever type the variable we pass to add() is, it will accept it — but in the get() method we'll inevitably have to "**cast**".
[java]

package org.sukru.classic;
import org.sukru.classic.Box;
public class BoxTest {
	public static void main(String[] args) {

        Box integerBox = new Box();

        integerBox.add(new Integer(10)); // What if I added a String here?

        Integer someInteger = (Integer) integerBox.get();

        System.out.println(someInteger);

	}

}

[/java]
Well, when we run this code there's no problem so far — but as I noted inside the code, what if I had passed the parameter as a String like `integerBox.add("10");`? That's when we'd get the `java.lang.ClassCastException` I mentioned at the start.
On to the solution: if we declare the Box class as a generic type with the expression below, whatever comes in is fine 🙂 By the way, note that although the class names are the same, I'm working under a different package.
[java]

package org.sukru.generics;
public class Box<T> {

	private T t; // T here means "Type".
	public void add(T t) {

		this.t = t;

	}
	public T get() {

		return t;

	}

}

[/java]
If we unpack the meaning of the T in the [plain]Box<T>[/plain] expression above, we can say it stands for "Type" — meaning an object of any type can be defined from this class.

It could be [plain]Box<Integer> integerBox = new Box<Integer>();[/plain] or [plain]Box<String> integerBox = new Box<String>(); [/plain] or any other type — except primitive types!
Now, building on this, we'll produce a Box object of type Integer and continue from there.
[java]

package org.sukru.generics;
public class BoxTest {
	public static void main(String[] args) {

		Box<Integer> integerBox = new Box<Integer>();

		integerBox.add(new Integer(10));

		Integer someInteger = integerBox.get(); // no cast needed!

		System.out.println(someInteger);

	}

}

[/java]
In the previous example we needed a cast to Integer; in this one we don't. Even better, IDEs warn you before you even run it if you try to pass a type other than Integer to the add() method without you noticing 🙂 I'd say that's the most important part 🙂
By the way, with Java 7 the object creation expression got shorter, becoming [plain]Box<Integer> integerBox = new Box<>();[/plain] — so there's no need to specify the type again in the part called the *diamond operator*.
A question may have popped into your mind: what is this "T" thing, and can I use something else? That's where the Java Naming Convention — the Java naming standards — steps in.

- E – Element (generally used in the Java Collection Framework)

- K – Key

- N – Number

- T – Type

- V – Value

- S,U,V etc. (these letters are picked when a 2nd, 3rd, 4th type is needed)

Without standards it would be hard to tell them apart — bless the standards 🙂

I hope it was useful for understanding the topic.
Take it easy.
*Note:* The examples at [http://download.oracle.com/javase/tutorial/java/generics/index.html](http://download.oracle.com/javase/tutorial/java/generics/index.html) were used to improve clarity.
