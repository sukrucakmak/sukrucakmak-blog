<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

// route.params.slug excludes the locale prefix, so the content path is
// /<locale>/<stem> — e.g. /tr/blog/my-post, /en/hakkinda.
const stem = '/' + ((route.params.slug as string[] | undefined) ?? []).join('/')

const { data: page } = await useAsyncData(`page-${locale.value}-${stem}`, () => {
  const collection = locale.value === 'tr' ? 'pages_tr' : 'pages_en'
  return queryCollection(collection).path(`/${locale.value}${stem}`).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const isPost = stem.startsWith('/blog/')

useSeoMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
})
</script>

<template>
  <UPage v-if="page">
    <UButton
      v-if="isPost"
      :to="localePath('/blog')"
      :label="t('post.backToBlog')"
      variant="link"
      icon="i-lucide-arrow-left"
      class="px-0"
    />
    <UPageHeader :title="page.title" :description="page.description" />
    <div v-if="isPost" class="flex flex-wrap items-center gap-3 text-sm text-muted -mt-4">
      <time v-if="page.date" :datetime="page.date">{{ formatPostDate(page.date, locale) }}</time>
      <UBadge
        v-for="tag in page.tags ?? []"
        :key="tag"
        :label="tag"
        variant="subtle"
        color="neutral"
        size="sm"
      />
    </div>
    <UPageBody>
      <ContentRenderer :value="page" />
    </UPageBody>
  </UPage>
</template>
