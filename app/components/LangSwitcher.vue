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
  <!-- Plain <a>: target is already a localized path and i18n's NuxtLink
       would re-localize it against the current locale (e.g. a TR path
       rendered on an EN page gets prefixed to a nonexistent /en route). -->
  <a
    v-if="other && target"
    :href="target"
    class="inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-medium ring ring-inset ring-accented text-default bg-default hover:bg-elevated transition-colors"
  >{{ other.name }}</a>
</template>
