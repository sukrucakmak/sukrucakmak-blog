# sukrucakmak-blog

Personal blog of Şükrü Çakmak — bilingual (TR/EN), built with Nuxt 4, Nuxt Content and @nuxtjs/i18n.

## Stack

- **Nuxt 4** + **@nuxt/content 3** — markdown-driven content
- **@nuxtjs/i18n** — Turkish (default, no prefix) + English (`/en` prefix)
- Static output via `npm run generate`

## Content layout

```text
content/
  tr/
    hakkinda.md           # about page  -> /hakkinda
    blog/<slug>.md        # posts       -> /blog/<slug>
  en/
    about.md              # about page  -> /en/about
    blog/<slug>.md        # posts       -> /en/blog/<slug>
```

Frontmatter for posts:

```yaml
---
title: Yazı Başlığı
description: Kısa özet.
date: 2026-10-18
tags: [java, spring]
translation: /en/blog/post-title   # route path of the counterpart (optional)
---
```

- Slugs do **not** need to match across languages; pair translated posts with the `translation` field (a route path like `/en/blog/x` or `/blog/x`) so the language switcher jumps straight to the other version.
- Posts without a translation simply exist in one locale.
- Regular pages (about, etc.) live outside `blog/` and are rendered by the same catch-all page.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
```

## Production

```bash
npm run generate   # static site -> .output/public
npm run build      # SSR build
npm run preview
```
