<script setup lang="ts">
const localePath = useLocalePath()
const { data: posts } = await useBlogPosts(3)
</script>

<template>
  <div>
    <section class="hero">
      <h1>{{ $t('home.greeting') }}</h1>
      <p class="tagline">
        {{ $t('site.tagline') }}
      </p>
      <p class="intro">
        {{ $t('home.intro') }}
      </p>
    </section>

    <section class="recent-posts">
      <h2>{{ $t('home.recentPosts') }}</h2>
      <PostList :posts="posts ?? []" />
      <NuxtLink :to="localePath('/blog')" class="all-posts">
        {{ $t('home.allPosts') }} →
      </NuxtLink>
    </section>
  </div>
</template>
