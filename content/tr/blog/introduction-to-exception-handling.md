---
title: "Introduction to Exception Handling – Hata Yakalamaya Giriş"
date: 2011-07-26
tags: [exceptions, java]
---

Java’da “exceptions” kavramı hataları yakalamak ve istisnai durumlar için kullanılır. Güçlü bir yazılım için çok gereklidir fakat çoğu zaman gözardı edilmektedir. Biz gözardı etmeyelim.
“Exception”, programın çalışması sırasında normal akışı kesen bir olaydır. Aşağıdaki resimde “main” metodundan sırasıyla aşağıdan yukarı bir akış görüyoruz ve son adımda bir hata olduğunu anlıyoruz. Hata aldığı yerden itibaren kod, hatayı yakalayabilecek kısmı (exception handler) aramaya başlıyor, bu sefer ters sırada. Hata yakalama mekanızmasını (handler) bulunca hatayı uygun yakalayıcıya geçiyor.
[![](/images/introduction-to-exception-handling-exceptions-callstack.gif)](/images/introduction-to-exception-handling-exceptions-callstack.gif)
Bu işlemlere hata yakalama (catch the exception) diyoruz.
[![](/images/introduction-to-exception-handling-exceptions-errorOccurs.gif)](/images/introduction-to-exception-handling-exceptions-errorOccurs.gif)
Hata yakalama işlemi;

- `try` kod bloğu içinde yakalanarak ya da

- `throws` ifadesi ile metodun başında belirlenerek yapılabilir.

> Hataların 3 tipi vardır;

> 1. Checked Exception

> 2. Error

> 3. Runtime Exception

**1. Checked Exception**

Örnek olarak `java.io.FileReader` sınıfından bir nesne ile dosya okuma işlemi yapıyorsunuz, dosya ismi veriyorsunuz ve dosyayı bulamayarak `java.io.FileNotFoundException` hatası fırlatıyor. İyi yazılmış bir programda bunu try-catch bloğu içinde yakalarsınız ve hatayı kullanıcıya bildirir, dosya ismini düzeltmesini sağlarsınız.
“Error” ya da “Runtime Exception” haricindeki bütün durumlar “Checked Exception” olur.
**2. Error**

Sizin uygulamanız dışındaki ekstra uygulamalardan kaynaklanan durumlardır. Örnek olarak, dosya okumak istiyorsunuz ama daha dosya sisteminize -mesela diske- erişilemiyor, işte burada “Error” tipinde bir durum oluşur, uygulama `java.io.IOError.` hatası fırlatır.
**3. Runtime Exception**

Uygulamanızın çalışma zamanında oluşan durumdur. Uygulamanın kendisinden kaynaklanır, programın bug ıdır, mantık hatasıdır ya da API’nın yanlış kullanımından kaynaklanır 🙂 He ben niye güldüm, herkes gibi ben de yaptım ve genellikle `NullPointerException` aldım ondan 🙂
Şimdi daha açık olması bakımından örneklersek, dosya okumak istiyorsunuz ama dosya adını vermediniz, ee ne olacak çat `NullPointerException` alacaksın. Yani çalışma zamanında uygulama patlamış (!) – genelde böyle derler- olacak.
Bu arada “Error” ve “Runtime Exception” kavramlarına topluca “Unchecked Exceptions” da denilir.
Giriş için daha doğrusu zihninizde yer edinmesi, karşılık bulması için bu kadar bilginin yeterli olduğunu düşünüyorum. Bu konuda yazacağım bir sonraki yazıda bol bol kod yazacağız 🙂
Kolay gelsin.
**Kaynaklar**

1. http://download.oracle.com/javase/tutorial/essential/exceptions/

2. http://tutorials.jenkov.com/java-exception-handling/index.html
