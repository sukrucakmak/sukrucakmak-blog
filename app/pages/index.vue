<script setup lang="ts">
const localePath = useLocalePath()
const { data: posts } = await useBlogPosts(4)
</script>

<template>
  <UPage>
    <UPageSection :ui="{ container: 'pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8' }">
      <div class="flex flex-col-reverse items-start gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div class="flex-1">
          <p class="text-sm font-medium text-primary">
            {{ $t('site.tagline') }}
          </p>
          <h1 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ $t('home.greeting') }}
          </h1>
          <p class="mt-4 max-w-xl text-muted">
            {{ $t('home.intro') }}
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <UButton
              :to="localePath('/blog')"
              :label="$t('home.viewBlog')"
              icon="i-lucide-book-open"
            />
            <UButton
              :to="localePath('/about')"
              :label="$t('nav.about')"
              variant="outline"
              icon="i-lucide-user"
            />
          </div>
          <div class="mt-2 flex gap-1">
            <UButton
              to="https://www.linkedin.com/in/sukrucakmak"
              target="_blank"
              icon="i-lucide-linkedin"
              variant="ghost"
              color="neutral"
              aria-label="LinkedIn"
            />
            <UButton
              to="https://github.com/sukrucakmak"
              target="_blank"
              icon="i-lucide-github"
              variant="ghost"
              color="neutral"
              aria-label="GitHub"
            />
            <UButton
              to="https://www.sukrucakmak.com"
              target="_blank"
              icon="i-lucide-globe"
              variant="ghost"
              color="neutral"
              aria-label="sukrucakmak.com"
            />
          </div>
        </div>
        <img
          src="/images/profile.png"
          :alt="$t('site.title')"
          class="w-36 h-36 rounded-2xl object-cover ring-1 ring-muted lg:w-52 lg:h-52"
        >
      </div>
    </UPageSection>

    <UPageSection
      :title="$t('home.recentPosts')"
      :ui="{ container: 'py-4 sm:py-6 lg:py-8', title: 'text-2xl text-left' }"
    >
      <PostList :posts="posts ?? []" variant="cards" />
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
