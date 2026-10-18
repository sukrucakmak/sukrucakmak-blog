<script setup lang="ts">
interface PostListItem {
  path: string
  title: string
  description?: string
  date?: string
  tags?: string[]
}

defineProps<{
  posts: PostListItem[]
}>()

const { t, locale } = useI18n()
</script>

<template>
  <p v-if="!posts.length" class="empty">
    {{ t('blog.empty') }}
  </p>
  <ul v-else class="post-list">
    <li v-for="post in posts" :key="post.path" class="post-item">
      <time v-if="post.date" :datetime="post.date">{{ formatPostDate(post.date, locale) }}</time>
      <h3>
        <NuxtLink :to="contentPathToRoute(post.path)">
          {{ post.title }}
        </NuxtLink>
      </h3>
      <p v-if="post.description" class="post-description">
        {{ post.description }}
      </p>
      <ul v-if="post.tags?.length" class="tags">
        <li v-for="tag in post.tags" :key="tag" class="tag">
          {{ tag }}
        </li>
      </ul>
    </li>
  </ul>
</template>
