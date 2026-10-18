// https://nuxt.com/docs/api/configuration/nuxt-config
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The link crawler only follows what pages link to — paginated blog posts
// beyond page 1 get no index.html and 404 on refresh. Enumerate every
// content file so all routes are prerendered.
function contentRoutes(): string[] {
  const routes: string[] = []
  for (const loc of ['tr', 'en'] as const) {
    const prefix = loc === 'en' ? '/en' : ''
    const dir = fileURLToPath(new URL(`./content/${loc}`, import.meta.url))
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.md'))
          routes.push(`${prefix}/${entry.name.slice(0, -3)}`)
      }
      for (const entry of readdirSync(`${dir}/blog`)) {
        if (entry.endsWith('.md'))
          routes.push(`${prefix}/blog/${entry.slice(0, -3)}`)
      }
    } catch { /* content dir missing — let the crawler do its best */ }
  }
  return routes
}

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/i18n',
  ],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  fonts: {
    families: [{ name: 'Public Sans', provider: 'google' }],
  },
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'tr',
    locales: [
      { code: 'tr', language: 'tr-TR', name: 'Türkçe', file: 'tr.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: false,
  },
  content: {
    build: {
      markdown: {
        highlight: {
          langs: ['bash', 'shell', 'html', 'java', 'sql', 'xml', 'json', 'yaml', 'typescript', 'javascript', 'vue', 'diff', 'properties', 'ini'],
        },
      },
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: contentRoutes(),
    },
  },
  compatibilityDate: '2024-04-03',
})
