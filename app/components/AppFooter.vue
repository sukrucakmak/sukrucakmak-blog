<script setup lang="ts">
const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-inner">
      <p>© {{ year }} {{ t('site.title') }} · {{ t('footer.builtWith') }}</p>
      <p class="footer-links">
        <a href="https://github.com/sukrucakmak" target="_blank" rel="noopener">GitHub</a>
        <a href="https://sukrucakmak.com" target="_blank" rel="noopener">sukrucakmak.com</a>
      </p>
    </div>
  </footer>
</template>
