---
title: Yeni Bloga Hoş Geldiniz
description: WordPress'ten Nuxt Content'e — blogun yeni altyapısı ve taşıma planı.
date: 2026-10-18
tags: [duyuru, blog]
translation: /en/blog/welcome-to-my-new-blog
---

Uzun yıllardır [sukrucakmak.com](https://sukrucakmak.com) üzerinde WordPress ile yazıyordum. Bu site artık **Nuxt 4** ve **Nuxt Content** ile çalışıyor — statik, hızlı ve tamamen markdown tabanlı.

## Neden taşınıyorum?

- **Markdown:** Yazılar artık düz markdown dosyaları. Git ile versiyonlanıyor, her yerde düzenlenebiliyor.
- **Hız:** Statik olarak üretilen sayfalar; veritabanı yok, eklenti güncellemesi derdi yok.
- **Çift dil:** Türkçe ve İngilizce içerik aynı yapıda yan yana duruyor.

## Taşıma planı

Eski yazıları tek tek markdown'a çevirip `content/tr/blog/` altına ekleyeceğim. Her yazıyı taşırken gözden geçirip güncelleyeceğim; eski WordPress yazılarının bağlantıları zamanla buraya yönlenecek.

Yeni yazılar için tek yapmam gereken `content/` altına bir `.md` dosyası eklemek:

```text
content/
  tr/blog/yeni-yazi.md      # Türkçe yazı
  en/blog/my-new-post.md    # İngilizce çevirisi (opsiyonel)
```

Şimdilik hoş geldiniz — yeni yazılarda görüşmek üzere.
