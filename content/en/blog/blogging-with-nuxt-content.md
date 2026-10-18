---
title: Blogging with Nuxt Content
description: The technical stack behind this site — Nuxt 4, Nuxt Content collections, and a bilingual content layout.
date: 2026-10-18
tags: [nuxt, vue, web]
translation: /blog/blogging-with-nuxt-content
---

As someone who has spent 20 years on the backend with Java and Spring, I visit the frontend world occasionally. For this blog I chose **Nuxt Content** for a simple reason: publishing is just opening a markdown file.

## Collections

Content is split into per-locale collections:

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

## Bilingual setup

Each post declares a `translation` field in frontmatter — the route path of its counterpart in the other language. The language switcher uses it to jump straight to the translation.

```yaml
---
title: Blogging with Nuxt Content
translation: /blog/blogging-with-nuxt-content
---
```

Coming from the Java side: markdown + Git is a far simpler experience than CMS databases. A post behaves like code — diffable, reviewable, revertible.
