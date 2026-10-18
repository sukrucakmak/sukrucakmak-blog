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
  <article v-if="page" class="content-page">
    <NuxtLink v-if="isPost" :to="localePath('/blog')" class="back-link">
      {{ t('post.backToBlog') }}
    </NuxtLink>
    <h1>{{ page.title }}</h1>
    <div v-if="isPost" class="post-meta">
      <time v-if="page.date" :datetime="page.date">{{ formatPostDate(page.date, locale) }}</time>
      <ul v-if="page.tags?.length" class="tags">
        <li v-for="tag in page.tags" :key="tag" class="tag">
          {{ tag }}
        </li>
      </ul>
    </div>
    <ContentRenderer :value="page" class="prose" />
  </article>
</template>
