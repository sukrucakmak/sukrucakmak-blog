<script setup lang="ts">
const { t } = useI18n()
const { data: posts } = await useBlogPosts()
const route = useRoute()
const router = useRouter()

const pageSize = 5
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
  const all = posts.value ?? []
  const maxPage = Math.max(1, Math.ceil(all.length / pageSize))
  const p = Math.min(page.value, maxPage)
  return all.slice((p - 1) * pageSize, p * pageSize)
})

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
      <PostList :posts="pagedPosts" />
      <div v-if="(posts?.length ?? 0) > pageSize" class="mt-8 flex justify-center">
        <UPagination
          v-model:page="page"
          :total="posts?.length ?? 0"
          :items-per-page="pageSize"
        />
      </div>
    </UPageBody>
  </UPage>
</template>
