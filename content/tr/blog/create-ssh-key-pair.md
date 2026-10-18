---
title: "SSH Key Pair Oluşturmak"
description: "ssh-keygen ile SSH key pair oluşturma ve sunucuya parolasız bağlantı kurma adımları."
date: 2019-06-26
tags: [application servers]
---

Güvenlik amaçlı bağlandığım yerlere çoğunlukla “username”/”password” kullanmaktansa SSH Key Pair oluşturarak “Public Key”i paylaşıp bağlanmayı tercih ediyorum.
Bu yazıda da **Mac OS** işletim sistemi için nasıl anahtar çifti oluşturulur detaylı bir şekilde anlatmaya çalışacağım.

## SSH Key Pair Nedir? (Güvenli Kabuk Anahtar Çifti)

Secure Shell (Güvenli Kabuk), güvensiz bir ağ üzerinde güvenli haberleşmeye olanak sağlayan bir kriptografik ağ protokolüdür.
Amacım şu an private-public key pair (özel-genel anahtar çifti) oluşturmak olduğu için “asimetrik şifreleme” ile RSA anahtar çifti üreteceğim. Aşağıda **ssh-keygen** aracının özelliklerini bulabilirsiniz.
![](/images/create-ssh-key-pair-Screenshot-2019-06-26-at-18.10.14.png)

1. Terminal üzerindeki aşağıdaki komutu çalıştıracağım. RSA anahtar çifti oluşturmama yardımcı olacak.
  `ssh-keygen -t rsa`

2. Hangi dosyaya kaydetmek istediğimizi soracak, istediğiniz ismi verebilirsiniz.

3. Bu adımdam sonra isterseniz bu anahtarları kullanmak için şifre koyabilirsiniz.

4. Çıktı aşağıdaki gibi olacaktır. Sizin bir private bir de public olmak üzere iki anahtar oluşturuldu. Private olanı kimse ile paylaşmamanız lazım.

5. Public olanının (sonu .pub ile bitiyor) içinden anahtarı alıp artık paylaşabilirsiniz.![](/images/create-ssh-key-pair-Screenshot-2019-06-26-at-19.33.20.png)

Kolay gelsin.
