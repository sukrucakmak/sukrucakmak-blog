<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  to?: string
  linkLabel?: string
}>()
</script>

<template>
  <div class="mb-7 flex flex-wrap items-end gap-x-9 gap-y-2">
    <h2 class="text-3xl font-extrabold tracking-tight text-highlighted sm:text-[40px] sm:leading-[1.05]">
      {{ title }}
    </h2>
    <p v-if="description" class="hidden max-w-md text-[15px] text-muted md:block">
      {{ description }}
    </p>
    <ULink
      v-if="to && linkLabel"
      :to="to"
      class="ml-auto inline-flex items-center gap-2 whitespace-nowrap font-semibold text-primary hover:text-primary/80"
    >
      {{ linkLabel }}
      <UIcon name="i-lucide-arrow-right" class="size-4" />
    </ULink>
  </div>
</template>
