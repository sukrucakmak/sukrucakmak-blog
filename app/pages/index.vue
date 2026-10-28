<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { data: posts } = await useBlogPosts(3)
</script>

<template>
  <div class="pb-6">
    <HomeHero />
    <HomeHighlights />

    <section class="pt-16 sm:pt-[72px]">
      <HomeSectionHeader
        :title="t('home.recentPosts')"
        :description="t('home.postsDescription')"
        :to="localePath('/blog')"
        :link-label="t('home.postsAll')"
      />
      <div class="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
        <PostCoverCard v-for="post in posts ?? []" :key="post.path" :post="post" />
      </div>
    </section>

    <section class="pt-16 sm:pt-[72px]">
      <HomeSectionHeader
        :title="t('home.talksTitle')"
        :description="t('home.talksDescription')"
        :to="localePath('/events')"
        :link-label="t('home.talksAll')"
      />
      <HomeTalks />
    </section>

    <section class="pt-16 sm:pt-[72px]">
      <HomeSectionHeader
        :title="t('home.journeyTitle')"
        :description="t('home.journeyDescription')"
        :to="localePath('/about')"
        :link-label="t('nav.about')"
      />
      <HomeJourney />
    </section>

    <section class="pt-16 sm:pt-20">
      <HomeContact />
    </section>
  </div>
</template>
