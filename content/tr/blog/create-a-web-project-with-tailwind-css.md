---
title: "Tailwind CSS ile Web Projesi Oluşturmak"
description: "Tailwind CSS ile web projesi kurmak: proje oluşturma, config yolları, directive'ler ve CSS derleme."
date: 2022-12-18
tags: [application servers]
translation: /en/blog/create-a-web-project-with-tailwind-css
---

## Proje klasörü ve Node.js aktivasyonu

```
mkdir tailwind-demo
cd tailwind-demo
npm init
```

## Tailwind CSS'i kur

```
npm install -D tailwindcss
npx tailwindcss init
```

Bu adımla tailwind için dev dependency ve tailwind.config.css dosyası oluşacaktır.

## Path'i ayarla

Dizini belirtmek için content alanını aşağıdaki gibi değiştir.

```
content: ["./src/**/*.{html,js}"],
```

## Tailwind directive'lerini ekle

src klasörü ve input.css dosyasını oluştur. src/input.css dosyan olacak; sonra aşağıdaki satırları ekle.

```
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Tailwind CSS Watch aracını package.json'a ekle

Bu watch script'ini package.json dosyasındaki scripts bölümüne ekle. Projeyi daha sonra bu komutla başlatacağız.

```
"watch": "npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch"
```

## Test amaçlı bir HTML sayfası oluştur

src klasörü altında index.html dosyası oluştur ve aşağıdaki satırları ekle.

```
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="/dist/output.css" rel="stylesheet">
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

## Projeyi başlat

```
npm run watch
```

index.html dosyasını LiveServer ya da benzeri bir test aracıyla tarayıcında aç. Tailwind destekli sayfayı göreceksin. Afiyet olsun.

```
http://127.0.0.1:5500/src/index.html
```
