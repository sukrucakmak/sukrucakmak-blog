<script setup lang="ts">
const { t } = useI18n()

const items = computed(() => [
  { icon: 'i-lucide-calendar-days', title: '20+', sub: t('home.highlights.years') },
  { icon: 'i-lucide-code-xml', title: t('home.highlights.javaTitle'), sub: t('home.highlights.java') },
  { icon: 'i-lucide-mic', title: t('home.highlights.stagesTitle'), sub: t('home.highlights.stages') },
  { icon: 'i-lucide-users', title: t('home.highlights.communityTitle'), sub: t('home.highlights.community') },
])
</script>

<template>
  <div class="band">
    <div v-for="item in items" :key="item.icon" class="hl">
      <UIcon :name="item.icon" class="size-7 shrink-0 text-primary" />
      <div>
        <b>{{ item.title }}</b>
        <small>{{ item.sub }}</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.band {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 24px;
  border-block: 1px solid var(--ui-border);
}
.hl {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 26px 24px;
}
.hl + .hl { border-left: 1px solid var(--ui-border); }
.hl b {
  display: block;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: .02em;
  text-transform: uppercase;
  color: var(--ui-text-highlighted);
}
.hl small {
  font: 500 11px/1.4 "JetBrains Mono", ui-monospace, monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}
@media (max-width: 1000px) {
  .band { grid-template-columns: repeat(2, 1fr); }
  .hl { justify-content: flex-start; padding: 20px 16px; }
  .hl:nth-child(3) { border-left: 0; }
  .hl:nth-child(n + 3) { border-top: 1px solid var(--ui-border); }
}
@media (max-width: 480px) {
  .hl { gap: 10px; padding: 16px 10px; }
  .hl b { font-size: 15px; }
  .hl small { font-size: 10px; letter-spacing: .1em; }
}
</style>
