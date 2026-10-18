---
title: Welcome to My New Blog
description: From WordPress to Nuxt Content — the blog's new stack and the migration plan.
date: 2026-10-18
tags: [announcement, blog]
translation: /blog/yeni-bloga-hos-geldiniz
---

For years I blogged on [sukrucakmak.com](https://sukrucakmak.com) with WordPress. This site now runs on **Nuxt 4** and **Nuxt Content** — static, fast, and entirely markdown-based.

## Why migrate?

- **Markdown:** Posts are now plain markdown files. Versioned with Git, editable anywhere.
- **Speed:** Statically generated pages; no database, no plugin-update chores.
- **Bilingual:** Turkish and English content live side by side in the same structure.

## The migration plan

I'll move old posts one by one into `content/tr/blog/` as markdown, reviewing and updating each as I go. Links from the old WordPress posts will gradually point here.

Publishing a new post is just adding a `.md` file under `content/`:

```text
content/
  tr/blog/yeni-yazi.md      # Turkish post
  en/blog/my-new-post.md    # English translation (optional)
```

Welcome — see you in the next posts.
