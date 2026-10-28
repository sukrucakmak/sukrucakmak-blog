<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

// route.params.slug excludes the locale prefix, so the content path is
// /<locale>/<stem> — e.g. /tr/blog/my-post, /en/about.
const stem = '/' + ((route.params.slug as string[] | undefined) ?? []).join('/')
const collection = locale.value === 'tr' ? 'pages_tr' : 'pages_en'

const { data: page } = await useAsyncData(`page-${locale.value}-${stem}`, () =>
  queryCollection(collection).path(`/${locale.value}${stem}`).first(),
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const isPost = stem.startsWith('/blog/')
const minutes = computed(() => readingMinutes(page.value?.body))

// Posts sharing a tag first, then the latest ones.
const { data: related } = await useAsyncData(`related-${locale.value}-${stem}`, async () => {
  if (!isPost) return []
  const all = await queryCollection(collection)
    .where('path', 'LIKE', `/${locale.value}/blog/%`)
    .where('path', '<>', `/${locale.value}${stem}`)
    .order('date', 'DESC')
    .select('path', 'title', 'description', 'date', 'tags')
    .all()
  const tags = new Set((page.value?.tags ?? []).filter(tag => !['rehber', 'guide'].includes(tag)))
  const shared = all.filter(p => p.tags?.some(tag => tags.has(tag)))
  return [...shared, ...all.filter(p => !shared.includes(p))].slice(0, 3)
})

useSeoMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
})
</script>

<template>
  <UPage v-if="page">
    <template v-if="isPost">
      <UButton
        :to="localePath('/blog')"
        :label="t('post.backToBlog')"
        variant="link"
        icon="i-lucide-arrow-left"
        class="mb-4 px-0"
      />
      <PostCover
        :title="page.title"
        :description="page.description"
        :date="page.date"
        :tags="page.tags"
        :minutes="minutes"
      />
      <div class="content-body mx-auto mt-10 max-w-3xl">
        <ContentRenderer :value="page" />
      </div>
      <section v-if="related?.length" class="mt-20 border-t border-default pt-14">
        <HomeSectionHeader
          :title="t('post.related')"
          :to="localePath('/blog')"
          :link-label="t('post.relatedAll')"
        />
        <div class="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          <PostCoverCard v-for="post in related" :key="post.path" :post="post" />
        </div>
      </section>
    </template>

    <template v-else>
      <header class="border-b border-default pb-8 pt-6 sm:pt-10">
        <p class="font-mono text-xs font-semibold uppercase tracking-[.18em] text-primary">
          {{ t('site.title') }}
        </p>
        <h1 class="mt-4 text-4xl font-extrabold tracking-tight text-highlighted sm:text-6xl">
          {{ page.title }}
        </h1>
        <p v-if="page.description" class="mt-4 max-w-2xl text-lg text-muted">
          {{ page.description }}
        </p>
      </header>
      <UPageBody>
        <div class="content-body">
          <ContentRenderer :value="page" />
        </div>
      </UPageBody>
    </template>
  </UPage>
</template>
