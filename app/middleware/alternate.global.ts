// Resolve the language-switcher target before render (the header paints before
// the page's async setup finishes, so the page itself is too late to set this).
export default defineNuxtRouteMiddleware(async (to) => {
  const alternate = useAlternatePath()

  // $i18n.locale still holds the SOURCE locale during cross-locale client
  // navigation — derive the locale from the destination route instead.
  const i18n = useNuxtApp().$i18n
  const defaultLocale = i18n.defaultLocale || 'tr'
  const codes = (i18n.locales.value ?? []).map(l => (typeof l === 'string' ? l : l.code))
  const locale = codes.find(c =>
    c !== defaultLocale && (to.path === `/${c}` || to.path.startsWith(`/${c}/`)),
  ) || defaultLocale

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
