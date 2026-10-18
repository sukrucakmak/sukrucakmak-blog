<script setup lang="ts">
const { t } = useI18n()
const { data: posts } = await useBlogPosts()

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
      <PostList :posts="posts ?? []" />
    </UPageBody>
  </UPage>
</template>
