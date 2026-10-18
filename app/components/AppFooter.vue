<script setup lang="ts">
const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-sm text-muted">
        © {{ year }} {{ t('site.title') }} · {{ t('footer.builtWith') }}
      </p>
    </template>
    <template #right>
      <div class="flex gap-4 text-sm">
        <ULink to="https://github.com/sukrucakmak" target="_blank" class="text-muted hover:text-default">
          GitHub
        </ULink>
        <ULink to="https://sukrucakmak.com" target="_blank" class="text-muted hover:text-default">
          sukrucakmak.com
        </ULink>
      </div>
    </template>
  </UFooter>
</template>
