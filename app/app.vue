<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

useHead(() => ({
  titleTemplate: (title?: string) => title ? `${title} — ${t('site.title')}` : t('site.title'),
}))
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <!-- key remounts the catch-all page between slugs (post -> post links) -->
      <NuxtPage :key="route.fullPath" />
    </NuxtLayout>
  </UApp>
</template>
