<script setup lang="ts">
const { locale } = useI18n()
const lang = computed(() => (locale.value === 'tr' ? 'tr' : 'en'))
</script>

<template>
  <div class="journey">
    <ol class="tl">
      <li v-for="step in journey" :key="step.year.en" class="stp" :class="{ now: step.current }">
        <span class="yr">{{ step.year[lang] }}</span>
        <b>{{ step.org[lang] }}</b>
        <span class="role">{{ step.role[lang] }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.journey { padding: 34px 34px 28px; border: 1px solid var(--ui-border); border-radius: 18px; background: var(--ui-bg); }
.tl { position: relative; display: grid; grid-template-columns: repeat(6, 1fr); gap: 18px; }
.tl::before {
  content: "";
  position: absolute;
  top: 9px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--ui-border), var(--ui-primary));
}
.stp { position: relative; padding-top: 30px; }
.stp::before {
  content: "";
  position: absolute;
  top: 3px;
  left: 0;
  width: 14px;
  height: 14px;
  border: 2px solid var(--ui-text-dimmed);
  border-radius: 50%;
  background: var(--ui-bg);
}
.stp.now::before {
  border-color: var(--ui-primary);
  background: var(--ui-primary);
  box-shadow: 0 0 0 5px color-mix(in oklab, var(--ui-primary) 18%, transparent);
}
.yr { font: 600 12px/1 "JetBrains Mono", ui-monospace, monospace; color: var(--ui-text-dimmed); }
.stp.now .yr { color: var(--ui-primary); }
b { display: block; margin-top: 8px; font-size: 16px; color: var(--ui-text-highlighted); }
.role { font-size: 13.5px; color: var(--ui-text-muted); }
@media (max-width: 1000px) {
  .journey { padding: 24px 20px; }
  .tl { grid-template-columns: repeat(2, 1fr); row-gap: 24px; }
  .tl::before { display: none; }
}
</style>
