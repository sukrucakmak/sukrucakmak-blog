---
title: Nuxt Content ile Blog Yazmak
description: Bu sitenin teknik altyapısı — Nuxt 4, Nuxt Content koleksiyonları ve çift dilli içerik düzeni.
date: 2026-10-18
tags: [nuxt, vue, web]
translation: /en/blog/blogging-with-nuxt-content
---

20 yıldır backend tarafında Java ve Spring ile çalışan biri olarak frontend dünyasına ara ara uğruyorum. Bu blogu kurarken tercihimi **Nuxt Content**'ten yana kullandım; sebebi basit: yazı yazmak istediğimde tek yapmam gereken bir markdown dosyası açmak.

## Koleksiyonlar

İçerik, dil bazında koleksiyonlara ayrılmış durumda:

```ts
// content.config.ts
collections: {
  blog_tr: defineCollection({
    type: 'page',
    source: { include: 'tr/blog/**', prefix: '/tr/blog' },
  }),
  blog_en: defineCollection({
    type: 'page',
    source: { include: 'en/blog/**', prefix: '/en/blog' },
  }),
}
```

## Çift dilli yapı

Her yazı için frontmatter'da `translation` alanı var — karşı dildeki yazının yolunu gösteriyor. Dil seçici bu alanı kullanarak doğrudan çeviriye gidiyor.

```yaml
---
title: Nuxt Content ile Blog Yazmak
translation: /en/blog/blogging-with-nuxt-content
---
```

Java tarafındaki alışkanlıklarla bakınca: markdown + Git, CMS veritabanlarından çok daha sade bir deneyim sunuyor. Yazı da kod gibi — diff'leniyor, review ediliyor, geri alınıyor.
