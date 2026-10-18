<script setup lang="ts">
interface PostListItem {
  path: string
  title: string
  description?: string
  date?: string
  tags?: string[]
}

const props = withDefaults(defineProps<{
  posts: PostListItem[]
  variant?: 'list' | 'cards'
}>(), {
  variant: 'list',
})

const { t, locale } = useI18n()
</script>

<template>
  <p v-if="!posts.length" class="text-muted">
    {{ t('blog.empty') }}
  </p>

  <div v-else-if="variant === 'list'" class="flex flex-col divide-y divide-default">
    <NuxtLink
      v-for="post in posts"
      :key="post.path"
      :to="contentPathToRoute(post.path)"
      class="group flex flex-col gap-2 py-6 sm:flex-row sm:gap-10"
    >
      <div class="shrink-0 text-sm text-muted sm:w-36 sm:pt-1">
        {{ post.date ? formatPostDate(post.date, locale) : '' }}
      </div>
      <div class="min-w-0">
        <h3 class="text-lg font-semibold text-highlighted group-hover:text-primary">
          {{ post.title }}
        </h3>
        <p v-if="post.description" class="mt-1 text-muted">
          {{ post.description }}
        </p>
        <div v-if="post.tags?.length" class="mt-3 flex flex-wrap gap-2">
          <UBadge
            v-for="tag in post.tags"
            :key="tag"
            :label="tag"
            variant="subtle"
            color="primary"
            size="sm"
          />
        </div>
      </div>
    </NuxtLink>
  </div>

  <UBlogPosts v-else class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
    <UBlogPost
      v-for="post in posts"
      :key="post.path"
      :title="post.title"
      :description="post.description"
      :date="post.date ? formatPostDate(post.date, locale) : undefined"
      :to="contentPathToRoute(post.path)"
      variant="outline"
    >
      <template v-if="post.tags?.length" #footer>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="tag in post.tags"
            :key="tag"
            :label="tag"
            variant="subtle"
            color="primary"
            size="sm"
          />
        </div>
      </template>
    </UBlogPost>
  </UBlogPosts>
</template>
