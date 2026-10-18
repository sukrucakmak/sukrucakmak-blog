<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const aboutRoute = computed(() => localePath(locale.value === 'tr' ? '/hakkinda' : '/about'))
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <NuxtLink :to="localePath('/')" class="site-title">
        {{ t('site.title') }}
      </NuxtLink>
      <nav class="nav">
        <NuxtLink :to="localePath('/blog')">
          {{ t('nav.blog') }}
        </NuxtLink>
        <NuxtLink :to="aboutRoute">
          {{ t('nav.about') }}
        </NuxtLink>
        <LangSwitcher />
      </nav>
    </div>
  </header>
</template>
