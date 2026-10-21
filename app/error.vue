<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()

const is404 = computed(() => props.error.statusCode === 404)
const title = computed(() => is404.value
  ? t('error.notFoundTitle')
  : `${props.error.statusCode} — ${t('error.genericTitle')}`)
const description = computed(() => is404.value
  ? t('error.notFoundDescription')
  : t('error.genericDescription'))

useHead(() => ({
  title: title.value,
  titleTemplate: (value?: string) => value ? `${value} — ${t('site.title')}` : t('site.title'),
  meta: [{ name: 'robots', content: 'noindex' }],
}))

function goHome() {
  clearError({ redirect: localePath('/') })
}
</script>

<template>
  <UApp>
    <NuxtLayout>
      <UPage>
        <section class="flex min-h-[50vh] flex-col items-center justify-center py-12 text-center sm:py-16">
          <p class="text-6xl font-bold tracking-tight text-primary sm:text-7xl" aria-hidden="true">
            {{ error.statusCode }}
          </p>
          <h1 class="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {{ title }}
          </h1>
          <p class="mt-3 max-w-md text-muted">
            {{ description }}
          </p>
          <UButton
            :to="localePath('/')"
            :label="t('error.backHome')"
            size="lg"
            class="mt-8 justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary!"
            @click.prevent="goHome"
          />
        </section>
      </UPage>
    </NuxtLayout>
  </UApp>
</template>
