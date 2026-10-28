<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const socials = [
  { label: 'LinkedIn', icon: 'i-simple-icons-linkedin', to: 'https://www.linkedin.com/in/sukrucakmak' },
  { label: 'GitHub', icon: 'i-simple-icons-github', to: 'https://github.com/sukrucakmak' },
  { label: 'sukru@sukru.org', icon: 'i-lucide-mail', to: 'mailto:sukru@sukru.org' },
]
</script>

<template>
  <div class="closing">
    <div>
      <div class="eyebrow">
        {{ t('home.contactEyebrow') }}
      </div>
      <h2>{{ t('home.contactTitle') }} <span>{{ t('home.contactAccent') }}</span></h2>
      <span class="hand">{{ t('home.contactHand') }}</span>
      <div class="mt-7 flex flex-wrap gap-3">
        <UButton :to="localePath('/contact')" :label="t('home.contactCta')" size="xl" trailing-icon="i-lucide-arrow-right" />
        <UButton
          to="https://www.linkedin.com/in/sukrucakmak"
          target="_blank"
          label="LinkedIn"
          trailing-icon="i-lucide-arrow-up-right"
          size="xl"
          color="neutral"
          variant="outline"
          class="bg-transparent text-white ring-white/20 hover:bg-white/10"
        />
      </div>
    </div>
    <div>
      <div class="eyebrow dim">
        {{ t('home.followTitle') }}
      </div>
      <p class="fine">
        {{ t('home.followDescription') }}
      </p>
      <div class="socials">
        <a v-for="s in socials" :key="s.label" :href="s.to" :target="s.to.startsWith('http') ? '_blank' : undefined" rel="noopener">
          <UIcon :name="s.icon" class="size-4" /> {{ s.label }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.closing {
  position: relative;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  align-items: end;
  gap: 48px;
  overflow: hidden;
  padding: 56px;
  border-radius: 22px;
  background: #141823;
  color: #fff;
}
:global(.dark) .closing { border: 1px solid var(--ui-border); }
.closing::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 120% at 100% 0%, rgba(91, 140, 255, .35), transparent 60%);
}
.closing > * { position: relative; }
.eyebrow {
  font: 600 12px/1 "JetBrains Mono", ui-monospace, monospace;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: #7da3ff;
}
.eyebrow.dim { color: #a8b4d6; }
h2 { margin-top: 14px; font-size: clamp(30px, 3.6vw, 46px); font-weight: 800; line-height: 1.08; letter-spacing: -.035em; }
h2 span { color: #7da3ff; }
.hand { display: block; margin-top: 14px; font: 24px/1 Caveat, "Segoe Print", cursive; color: #a8b4d6; }
.fine { margin-top: 12px; font-size: 14px; color: #8f97ab; }
.socials { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.socials a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #30374b;
  border-radius: 10px;
  background: #0d1018;
  font-size: 14px;
  font-weight: 500;
  transition: border-color .2s;
}
.socials a:hover { border-color: #7da3ff; }
@media (max-width: 1000px) {
  .closing { grid-template-columns: 1fr; gap: 32px; padding: 32px 24px; }
}
</style>
