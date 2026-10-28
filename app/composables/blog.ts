// Shared helpers for querying localized content collections.

// Route path of the same page in the other locale; set by content pages
// that declare `translation:` in frontmatter.
export const useAlternatePath = () => useState<string | null>('alternatePath', () => null)

export function useBlogPosts(limit?: number) {
  const { locale } = useI18n()
  return useAsyncData(`blog-posts-${locale.value}-${limit ?? 'all'}`, () => {
    const collection = locale.value === 'tr' ? 'pages_tr' : 'pages_en'
    const query = queryCollection(collection)
      .where('path', 'LIKE', `/${locale.value}/blog/%`)
      .order('date', 'DESC')
      .select('path', 'title', 'description', 'date', 'tags')
    return limit ? query.limit(limit).all() : query.all()
  })
}

// Content paths carry the locale dir (/tr/..., /en/...) while routes only
// prefix non-default locales: /tr/blog/x -> /blog/x, /en/blog/x -> /en/blog/x.
export function contentPathToRoute(path: string) {
  return path.replace(/^\/tr/, '') || '/'
}

export function formatPostDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Nuxt Content minimark body: nodes are strings or [tag, props, ...children].
export function readingMinutes(body: unknown) {
  let words = 0
  const walk = (node: unknown) => {
    if (typeof node === 'string') words += node.split(/\s+/).filter(Boolean).length
    else if (Array.isArray(node)) node.slice(2).forEach(walk)
  }
  ;((body as { value?: unknown[] } | undefined)?.value ?? []).forEach(walk)
  return Math.max(1, Math.round(words / 200))
}
