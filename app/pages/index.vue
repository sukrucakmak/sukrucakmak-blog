<script setup lang="ts">
const localePath = useLocalePath()
const { data: posts } = await useBlogPosts(3)
</script>

<template>
  <UPage>
    <UPageHero
      :title="$t('home.greeting')"
      :headline="$t('site.tagline')"
      :description="$t('home.intro')"
    />

    <UPageSection :title="$t('home.recentPosts')" :ui="{ container: 'py-0 sm:py-0 lg:py-0' }">
      <PostList :posts="posts ?? []" />
      <UButton
        :to="localePath('/blog')"
        :label="$t('home.allPosts')"
        variant="link"
        trailing-icon="i-lucide-arrow-right"
        class="mt-6 px-0"
      />
    </UPageSection>
  </UPage>
</template>
