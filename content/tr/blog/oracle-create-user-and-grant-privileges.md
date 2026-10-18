---
title: "Oracle’da Kullanıcı Açmak ve Yetki Vermek"
description: "Oracle'da yeni kullanıcı açma ve yetki (grant) verme komutları."
date: 2017-08-08
tags: [oracle]
---

Merhaba, Oracle DB üzerinde kullanıcı açmak için gerekli komutlar aşağıdaki gibi olabilir. Bu arada yetkili bir kullanıcı ile bağlandığımızı farz ediyorum. Kullanıcı adını SUKRU olarak belirledim.
Kullanıcı tanımlamak için

[sql]CREATE USER SUKRU IDENTIFIED BY SUKRU[/sql]
Bağlanma hakkı vermek için

[sql]GRANT CREATE SESSION TO SUKRU[/sql]
Tablo oluşturma hakkı vermek için

[sql]GRANT CREATE TABLE TO SUKRU[/sql]
Sequence oluşturma hakkı vermek için

[sql]GRANT CREATE SEQUENCE TO SUKRU[/sql]
Tablespace alanını kullanabilmek için

[sql]GRANT UNLIMITED TABLESPACE TO SUKRU[/sql]
Güncel sürüm Oracle’da SELECT, INSERT, UPDATE, DELETE için yetki gerekmiyor ama gerekirse

[sql]GRANT

  SELECT,

  INSERT,

  UPDATE,

  DELETE

ON

  schema.table

TO

  SUKRU

[/sql]
