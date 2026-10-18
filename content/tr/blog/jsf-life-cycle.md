---
title: "JSF Life Cycle (Yaşam Döngüsü)"
date: 2011-06-28
tags: [java, jsf]
---

Bu yazıda [JSF Uygulama Çatısı](http://tr.wikipedia.org/wiki/JavaServer_Faces) ([JavaServer Faces Framework](http://en.wikipedia.org/wiki/JavaServer_Faces))’nın nasıl bir hayat sürdüğünü yazmaya çalışacağım 🙂 Geç yatar, geç kalkar, alkol de alırmış… Şaka bir yana, JSF’in web sayfasında işlem yapmamızdan işlemin sonucunu bize gösterene kadar hangi işlemleri yaptığı ve bize nasıl cevap verdiğini bu işlere ilk başlamam da çok merak etmiştim, hatta aramış taramış anlamamıştım, çünkü bunu açıkça anlatan pek bir kaynak yoktu, olanlar da benim dilimden anlatmıyordu (köylü usulü arıyordum çünkü 🙂 ).

> Bir JSF isteği 6 adımda işlenir.

[JSF Referans kitabı](http://jsfcompref.appspot.com/)ndan aldığım şu resim olayı betimliyor. Ben de bu adımları tek tek açacağım.

[![jsf-life-cycle](/images/jsf-life-cycle-jsf-life-cycle.png)](/images/jsf-life-cycle-jsf-life-cycle.png)
Şimdi bu adımları sıralayalım;

1. Create or Restore View

2. Apply Values from User

3. Ensure Values are Valid

4. Update Model with Valid Values

5. Fetch a New View, If Necessary

6. Render View

***1. Create or Restore View*** (Görünümü oluştur)

Bir JSF uygulamasını açtığımız anda karşımıza gelen sayfaya ait bileşenlerin oluşması gerçekleşir. Kullanıcı burada bir “submit” yani bir gönderme işlemi -genellikle bir buton aracılığı ile olur ama ajax ile başka yöntemler de mevcut- gerçekleştirir.
***2. Apply Values from User*** (Kullanıcıdan verileri al)

Kullanıcının girdiği değerler bu “Apply Values” fazında alınır.
***3. Ensure Values are Valid*** (Verilerin doğruluğunu kontrol et)

Kullanıcının girdiği değerlerin kritelerle uyup uymadığı, zorunlu alanların doldurup doldurulmadığı vb diğer işlemler bu fazda kontrol edilir, eğer herşey uygunsa bir sonraki faza geçilir, yoksa ilk faza dönülür. Mesela ilgili alana sadece sayı girilmesini istemişiz ama kullanıcı harf yazmış ya da ilgili alanı zorunlu yapmışız ama kullanıcı herhangi bir değer vermeden formu göndermiş gibi…
***4. Update Model with Valid Values*** (Verilerle modeli güncelleştir)

Verilerin doğruluğunun bir önceki fazda kontrolünden sonra sıra artık modeli (bean, entity vb.) güncelleştirir yani formdan elde edilen verilen yapışmasını sağlar. Formdaki “name” alanına girilmiş veri “Student” sınıfının “name” alanına yapışması gibi…
***5. Fetch a New View, If Necessary*** (Gerekliyse yeni bir görünüm oluştur)

Eğer formdaki işlemler sonucu yeni bir görünüm yaratmak istiyorsak onu oluşturur.
***6. Render View*** (Görünümü İşle)

Son olarak web sayfasını kullanıcıya tekrardan göstermek için bu faz çalışır ve görünüm işlenmiş olur.
Genel hatlarıyla JSF’in böyle bir yaşantısı var, şimdilik mâkul görünüyor ne dersiniz 🙂
