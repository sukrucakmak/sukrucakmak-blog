<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <UMain class="flex-1">
      <UContainer class="py-6 sm:py-8">
        <slot />
      </UContainer>
    </UMain>
    <AppFooter />
  </div>
</template>
