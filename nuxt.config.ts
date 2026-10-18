// https://nuxt.com/docs/api/configuration/nuxt-config
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
  compatibilityDate: '2024-04-03',
})
