<script setup lang="ts">
const { t } = useI18n()
const { data: posts } = await useBlogPosts()

useSeoMeta({
  title: () => t('blog.title'),
  description: () => t('blog.description'),
})
</script>

<template>
  <div>
    <h1>{{ $t('blog.title') }}</h1>
    <p class="page-description">
      {{ $t('blog.description') }}
    </p>
    <PostList :posts="posts ?? []" />
  </div>
</template>
