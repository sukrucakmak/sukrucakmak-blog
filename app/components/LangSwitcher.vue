<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const alternate = useAlternatePath()

const other = computed(() => locales.value.find(l => l.code !== locale.value))
const target = computed(() => {
  if (!other.value) return null
  // When the current page declares its counterpart, link straight to it;
  // otherwise switch the same route (e.g. home, blog index).
  return alternate.value ?? switchLocalePath(other.value.code)
})
</script>

<template>
  <NuxtLink v-if="other && target" :to="target" class="lang-switch">
    {{ other.name }}
  </NuxtLink>
</template>
