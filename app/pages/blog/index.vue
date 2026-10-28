<script setup lang="ts">
const { t } = useI18n()
const { data: posts } = await useBlogPosts()
const route = useRoute()
const router = useRouter()

const pageSize = 9

const activeTag = computed(() =>
  typeof route.query.tag === 'string' && route.query.tag ? route.query.tag : null,
)

const allTags = computed(() => {
  const counts = new Map<string, number>()
  for (const post of posts.value ?? []) {
    for (const tag of post.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )
})

const filteredPosts = computed(() => {
  const all = posts.value ?? []
  if (!activeTag.value) return all
  return all.filter((post) => post.tags?.includes(activeTag.value!))
})

const page = computed({
  get: () => {
    const n = Number(route.query.page)
    return Number.isInteger(n) && n > 0 ? n : 1
  },
  set: (v) => {
    router.replace({ query: { ...route.query, page: v > 1 ? v : undefined } })
  },
})
const pagedPosts = computed(() => {
  const all = filteredPosts.value
  const maxPage = Math.max(1, Math.ceil(all.length / pageSize))
  const p = Math.min(page.value, maxPage)
  return all.slice((p - 1) * pageSize, p * pageSize)
})

function setTag(tag: string | null) {
  router.replace({
    query: { ...route.query, tag: tag ?? undefined, page: undefined },
  })
}

useSeoMeta({
  title: () => t('blog.title'),
  description: () => t('blog.description'),
})
</script>

<template>
  <UPage>
    <header class="pb-8 pt-6 sm:pt-10">
      <p class="font-mono text-xs font-semibold uppercase tracking-[.18em] text-primary">
        {{ $t('blog.eyebrow') }}
      </p>
      <h1 class="mt-4 text-4xl font-extrabold tracking-tight text-highlighted sm:text-6xl">
        {{ $t('blog.title') }}
      </h1>
      <p class="mt-4 max-w-2xl text-lg text-muted">
        {{ $t('blog.description') }}
      </p>
    </header>

    <nav v-if="allTags.length" :aria-label="$t('blog.categories')" class="flex flex-wrap gap-2 border-y border-default py-5">
      <button
        type="button"
        class="pill"
        :class="{ on: activeTag === null }"
        @click="setTag(null)"
      >
        {{ $t('blog.all') }} <span class="opacity-60">{{ posts?.length ?? 0 }}</span>
      </button>
      <button
        v-for="[tag, count] in allTags"
        :key="tag"
        type="button"
        class="pill"
        :class="{ on: activeTag === tag }"
        @click="setTag(activeTag === tag ? null : tag)"
      >
        {{ tag }} <span class="opacity-60">{{ count }}</span>
      </button>
    </nav>

    <div class="mt-10">
      <p v-if="!pagedPosts.length" class="text-muted">
        {{ $t('blog.empty') }}
      </p>
      <div v-else class="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
        <PostCoverCard v-for="post in pagedPosts" :key="post.path" :post="post" />
      </div>
      <div v-if="filteredPosts.length > pageSize" class="mt-12 flex justify-center">
        <UPagination
          v-model:page="page"
          :total="filteredPosts.length"
          :items-per-page="pageSize"
        />
      </div>
    </div>
  </UPage>
</template>

<style scoped>
.pill {
  padding: 7px 13px;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1;
  color: var(--ui-text-muted);
  transition: border-color .15s, color .15s, background .15s;
}
.pill:hover { border-color: var(--ui-primary); color: var(--ui-text-highlighted); }
.pill.on { border-color: var(--ui-primary); background: var(--ui-primary); color: #fff; }
</style>
