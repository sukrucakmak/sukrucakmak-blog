<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <UMain class="flex-1">
      <UContainer class="max-w-3xl py-10 sm:py-14">
        <slot />
      </UContainer>
    </UMain>
    <AppFooter />
  </div>
</template>
