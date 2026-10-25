import { defineContentConfig, defineCollection, z } from '@nuxt/content'
import { scheduledPosts } from './scheduled-posts'

const scheduled = scheduledPosts()

const pageSchema = z.object({
  date: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Route path of the same page in the other locale, e.g. /en/blog/my-post
  translation: z.string().optional(),
})

export default defineContentConfig({
  collections: {
    pages_tr: defineCollection({
      type: 'page',
      source: { include: 'tr/**', exclude: scheduled.filter(p => p.startsWith('tr/')), prefix: '/tr' },
      schema: pageSchema,
    }),
    pages_en: defineCollection({
      type: 'page',
      source: { include: 'en/**', exclude: scheduled.filter(p => p.startsWith('en/')), prefix: '/en' },
      schema: pageSchema,
    }),
  },
})
