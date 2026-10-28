<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const localePath = useLocalePath()

const items = computed<NavigationMenuItem[]>(() => [
  { label: t('nav.blog'), to: localePath('/blog') },
  { label: t('nav.about'), to: localePath('/about') },
  { label: t('nav.events'), to: localePath('/events') },
  { label: t('nav.contact'), to: localePath('/contact') },
])
</script>

<template>
  <UHeader :title="t('site.title')" :to="localePath('/')">
    <template #title>
      <span class="text-xl font-extrabold uppercase tracking-tight">{{ t('site.title') }}<span class="text-primary">.</span></span>
    </template>
    <UNavigationMenu :items="items" variant="link" />
    <template #right>
      <UColorModeButton />
      <LangSwitcher />
    </template>
    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
