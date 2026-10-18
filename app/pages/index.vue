<script setup lang="ts">
const localePath = useLocalePath()
const { data: posts } = await useBlogPosts(4)
</script>

<template>
  <UPage>
    <UPageSection :ui="{ container: 'px-0 sm:px-0 lg:px-0 py-8 sm:py-10 lg:py-12' }">
      <div class="relative flex flex-col-reverse items-start gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div
          aria-hidden="true"
          class="hero-gradient pointer-events-none absolute -inset-x-10 top-[12%] h-[70%] -z-10 sm:-inset-x-16 lg:-inset-x-32"
        />
        <div class="flex-1">
          <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
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
      :ui="{ container: 'px-0 sm:px-0 lg:px-0 py-2 sm:py-3 lg:py-4 gap-4 sm:gap-6', title: 'text-2xl text-left' }"
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
