<script setup lang="ts">
const props = defineProps<{
  post: {
    path: string
    title: string
    description?: string
    date?: string
    tags?: string[]
  }
}>()

const { locale } = useI18n()
const cover = computed(() => coverFor(props.post.tags))
const tags = computed(() => (props.post.tags ?? []).filter(t => !['rehber', 'guide'].includes(t)).slice(0, 2))
</script>

<template>
  <NuxtLink :to="contentPathToRoute(post.path)" class="card group">
    <div class="cover" :style="{ background: `radial-gradient(120% 140% at 0% 0%, ${cover.from} 0%, ${cover.to} 70%)` }">
      <UIcon :name="cover.icon" class="logo" :style="{ color: cover.iconColor }" />
      <pre><template v-for="(line, i) in cover.lines" :key="i"><span v-if="line.cmd"><span class="p">$</span> {{ line.cmd }}</span><span v-else class="dim">{{ line.out }}</span>
</template></pre>
    </div>
    <div class="body">
      <div class="meta">
        <span v-if="post.date">{{ formatPostDate(post.date, locale) }}</span>
        <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <h3>{{ post.title }}</h3>
      <p v-if="post.description" class="desc">
        {{ post.description }}
      </p>
      <span class="go"><UIcon name="i-lucide-arrow-right" class="size-4" /></span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: 16px;
  background: var(--ui-bg);
  transition: transform .2s, box-shadow .2s;
}
.card:hover { transform: translateY(-3px); box-shadow: 0 24px 40px -24px rgba(15, 18, 34, .35); }
.cover {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  height: 170px;
  padding: 0 22px;
  overflow: hidden;
}
.logo { flex: none; width: 64px; height: 64px; filter: drop-shadow(0 10px 20px rgba(0, 0, 0, .4)); }
.cover pre {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 10px;
  background: rgba(5, 8, 14, .72);
  color: #e6e9f2;
  font: 12px/1.7 "JetBrains Mono", ui-monospace, monospace;
  white-space: pre;
}
.p { color: #5b8cff; }
.dim { color: #8b93a8; }
.body { display: flex; flex: 1; flex-direction: column; padding: 20px 22px 22px; }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ui-text-muted); }
.tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--ui-primary) 12%, transparent);
  color: var(--ui-primary);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}
h3 {
  margin: 14px 0 8px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -.02em;
  color: var(--ui-text-highlighted);
}
.desc { flex: 1; font-size: 14.5px; color: var(--ui-text-muted); }
.go {
  display: grid;
  place-items: center;
  align-self: flex-end;
  width: 38px;
  height: 38px;
  margin-top: 14px;
  border: 1px solid var(--ui-border);
  border-radius: 50%;
  color: var(--ui-text-highlighted);
  transition: background .2s, color .2s, border-color .2s;
}
.card:hover .go { border-color: var(--ui-primary); background: var(--ui-primary); color: #fff; }
</style>
