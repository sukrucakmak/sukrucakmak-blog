// Resolve the language-switcher target before render (the header paints before
// the page's async setup finishes, so the page itself is too late to set this).
export default defineNuxtRouteMiddleware(async (to) => {
  const locale = useNuxtApp().$i18n.locale.value
  const alternate = useAlternatePath()

  const slug = (to.params.slug as string[] | undefined) ?? []
  if (!slug.length) {
    alternate.value = null
    return
  }

  const stem = '/' + slug.join('/')
  const collection = locale === 'tr' ? 'pages_tr' : 'pages_en'
  const doc = await queryCollection(collection).path(`/${locale}${stem}`).first()

  // Declared counterpart wins; otherwise fall back to the other locale's
  // section index so the switcher never links to a 404.
  const fallback = stem.startsWith('/blog/')
    ? (locale === 'tr' ? '/en/blog' : '/blog')
    : (locale === 'tr' ? '/en' : '/')
  alternate.value = doc?.translation ?? fallback
})
