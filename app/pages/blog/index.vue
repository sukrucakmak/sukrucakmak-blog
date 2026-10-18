<script setup lang="ts">
const { t } = useI18n()
const { data: posts } = await useBlogPosts()
const route = useRoute()
const router = useRouter()

const pageSize = 5

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
    <UPageHeader
      :title="$t('blog.title')"
      :description="$t('blog.description')"
    />
    <UPageBody>
      <div class="flex flex-col-reverse gap-10 lg:flex-row lg:gap-14">
        <div class="min-w-0 flex-1">
          <PostList :posts="pagedPosts" />
          <div v-if="filteredPosts.length > pageSize" class="mt-8 flex justify-center">
            <UPagination
              v-model:page="page"
              :total="filteredPosts.length"
              :items-per-page="pageSize"
            />
          </div>
        </div>
        <aside v-if="allTags.length" class="shrink-0 lg:w-56">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
            {{ $t('blog.categories') }}
          </h2>
          <ul class="mt-4 flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:items-start lg:gap-y-1.5">
            <li>
              <button
                type="button"
                class="text-sm"
                :class="activeTag === null ? 'font-semibold text-primary' : 'text-muted hover:text-highlighted'"
                @click="setTag(null)"
              >
                {{ $t('blog.all') }}
                <span class="text-muted">({{ posts?.length ?? 0 }})</span>
              </button>
            </li>
            <li v-for="[tag, count] in allTags" :key="tag">
              <button
                type="button"
                class="text-sm"
                :class="activeTag === tag ? 'font-semibold text-primary' : 'text-muted hover:text-highlighted'"
                @click="setTag(activeTag === tag ? null : tag)"
              >
                {{ tag }}
                <span class="text-muted">({{ count }})</span>
              </button>
            </li>
          </ul>
        </aside>
      </div>
    </UPageBody>
  </UPage>
</template>
