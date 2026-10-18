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

const gridClass = computed(() =>
  props.variant === 'cards'
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6'
    : 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-6',
)
const postVariant = computed(() => (props.variant === 'cards' ? 'outline' : 'ghost'))

const { t, locale } = useI18n()
</script>

<template>
  <p v-if="!posts.length" class="text-muted">
    {{ t('blog.empty') }}
  </p>
  <UBlogPosts v-else :class="gridClass">
    <UBlogPost
      v-for="post in posts"
      :key="post.path"
      :title="post.title"
      :description="post.description"
      :date="post.date ? formatPostDate(post.date, locale) : undefined"
      :to="contentPathToRoute(post.path)"
      :variant="postVariant"
    >
      <template v-if="post.tags?.length" #footer>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="tag in post.tags"
            :key="tag"
            :label="tag"
            variant="subtle"
            color="neutral"
            size="sm"
          />
        </div>
      </template>
    </UBlogPost>
  </UBlogPosts>
</template>
