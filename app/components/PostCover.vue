<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
  date?: string
  tags?: string[]
  minutes: number
}>()

const { t, locale } = useI18n()
const cover = computed(() => coverFor(props.tags))
</script>

<template>
  <header
    class="post-cover"
    :style="{ background: `radial-gradient(120% 160% at 0% 0%, ${cover.from} 0%, ${cover.to} 65%)` }"
  >
    <div class="min-w-0">
      <p class="meta">
        <time v-if="date" :datetime="date">{{ formatPostDate(date, locale) }}</time>
        <span class="mx-2 opacity-50">·</span>{{ t('post.readingTime', { n: minutes }) }}
      </p>
      <h1>{{ title }}</h1>
      <p v-if="description" class="desc">
        {{ description }}
      </p>
      <div v-if="tags?.length" class="mt-6 flex flex-wrap gap-2">
        <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>
    <div class="art" aria-hidden="true">
      <UIcon :name="cover.icon" class="logo" :style="{ color: cover.iconColor }" />
      <pre><template v-for="(line, i) in cover.lines" :key="i"><span v-if="line.cmd"><span class="p">$</span> {{ line.cmd }}</span><span v-else class="dim">{{ line.out }}</span>
</template></pre>
    </div>
  </header>
</template>

<style scoped>
.post-cover {
  position: relative;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  align-items: center;
  gap: 48px;
  overflow: hidden;
  padding: 52px 56px;
  border-radius: 22px;
  color: #fff;
}
.post-cover::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg, transparent 0 46px, rgba(255, 255, 255, .03) 46px 47px),
    repeating-linear-gradient(0deg, transparent 0 46px, rgba(255, 255, 255, .03) 46px 47px);
  pointer-events: none;
}
.post-cover > * { position: relative; }
.meta {
  font: 600 12px/1.4 var(--font-mono);
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .7);
}
h1 {
  margin-top: 16px;
  font-size: clamp(30px, 3.6vw, 48px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -.035em;
}
.desc { margin-top: 16px; max-width: 640px; font-size: 18px; line-height: 1.55; color: rgba(255, 255, 255, .78); }
.tag {
  padding: 6px 11px;
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 999px;
  background: rgba(255, 255, 255, .08);
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
}
.art { display: flex; align-items: center; gap: 22px; }
.logo { flex: none; width: 88px; height: 88px; filter: drop-shadow(0 14px 24px rgba(0, 0, 0, .45)); }
.art pre {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 12px;
  background: rgba(5, 8, 14, .72);
  color: #e6e9f2;
  font: 13px/1.75 var(--font-mono);
  white-space: pre;
}
.p { color: #5b8cff; }
.dim { color: #8b93a8; }
@media (max-width: 1000px) {
  .post-cover { grid-template-columns: 1fr; padding: 32px 24px; }
  .art { display: none; }
}
</style>
