<script setup lang="ts">
const { t, locale } = useI18n()
const lang = computed(() => (locale.value === 'tr' ? 'tr' : 'en'))

const featuredDate = computed(() => formatPostDate(`${featuredTalk.date}T12:00:00`, locale.value))
const events = computed(() => recentEvents.map(e => ({ ...e, ...eventDateParts(e.date, locale.value) })))
</script>

<template>
  <div class="talks">
    <a
      class="video"
      :href="`https://www.youtube.com/watch?v=${featuredTalk.youtubeId}`"
      target="_blank"
      rel="noopener"
    >
      <img :src="`https://i.ytimg.com/vi/${featuredTalk.youtubeId}/hqdefault.jpg`" alt="" loading="lazy">
      <span class="play"><UIcon name="i-lucide-play" class="size-7 fill-current" /></span>
      <div class="vt">
        <div class="eyebrow">{{ t('home.latestTalk') }} · {{ featuredDate }} · <span lang="en">{{ featuredTalk.kind }}</span></div>
        <h3>{{ featuredTalk.title }}</h3>
      </div>
    </a>
    <div>
      <div v-for="e in events" :key="e.date" class="e">
        <div class="cal">
          <b>{{ e.day }}</b><small>{{ e.month }}</small>
        </div>
        <div class="min-w-0">
          <h4>
            <ULink v-if="e.url" :to="e.url" target="_blank" class="hover:text-primary">{{ e.title[lang] }}</ULink>
            <template v-else>{{ e.title[lang] }}</template>
          </h4>
          <div class="role">{{ e.role[lang] }}</div>
        </div>
        <ULink v-if="e.video" :to="e.video" target="_blank" class="vbtn">
          <UIcon name="i-lucide-play" class="size-3" /> {{ t('home.video') }}
        </ULink>
        <span v-else />
      </div>
    </div>
  </div>
</template>

<style scoped>
.talks { display: grid; grid-template-columns: 1.15fr 1fr; gap: 28px; }
.video {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  aspect-ratio: 16 / 9;
  padding: 26px;
  overflow: hidden;
  border-radius: 16px;
  background: #141823;
  color: #fff;
}
.video img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .35; transition: opacity .3s, transform .4s; }
.video::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(180deg, rgba(20, 24, 35, .1) 30%, rgba(20, 24, 35, .92) 100%), radial-gradient(80% 90% at 85% 10%, rgba(91, 140, 255, .35), transparent 60%);
}
.video:hover img { opacity: .6; transform: scale(1.03); }
.play {
  position: absolute;
  top: 44%;
  left: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: var(--ui-primary);
  box-shadow: 0 0 0 12px color-mix(in oklab, var(--ui-primary) 25%, transparent);
  transform: translate(-50%, -50%);
}
.vt { position: relative; z-index: 2; }
.eyebrow {
  font: 600 12px/1.4 "JetBrains Mono", ui-monospace, monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: #a8b4d6;
}
.video h3 { max-width: 520px; margin-top: 10px; font-size: 24px; font-weight: 700; line-height: 1.25; letter-spacing: -.02em; }
.e {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--ui-border);
}
.e:first-child { padding-top: 0; }
.cal { padding: 9px 0; border: 1px solid var(--ui-border); border-radius: 12px; background: var(--ui-bg); text-align: center; }
.cal b { display: block; font-size: 21px; font-weight: 800; line-height: 1; color: var(--ui-text-highlighted); }
.cal small { font: 600 10.5px/1 "JetBrains Mono", ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; color: var(--ui-primary); }
h4 { font-size: 15.5px; font-weight: 600; line-height: 1.35; color: var(--ui-text-highlighted); }
.role { margin-top: 3px; font-size: 13px; color: var(--ui-text-dimmed); }
.vbtn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 11px;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  color: var(--ui-primary);
}
.vbtn:hover { border-color: var(--ui-primary); }
@media (max-width: 1000px) {
  .talks { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .video { padding: 18px; }
  .video h3 { font-size: 18px; }
  .play { width: 56px; height: 56px; }
  .e { grid-template-columns: 56px 1fr; }
  .vbtn { grid-column: 2; justify-self: start; }
}
</style>
