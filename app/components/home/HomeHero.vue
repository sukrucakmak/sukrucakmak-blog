<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const words = computed(() => ['Java', 'Spring', 'Kubernetes', 'Docker', 'Cloud', 'CI/CD', t('home.chips.community')])

const chips = computed(() => [
  { cls: 'c1', icon: 'i-simple-icons-springboot', color: '#6db33f', title: 'Spring Boot', sub: t('home.chips.spring') },
  { cls: 'c2', icon: 'i-simple-icons-openjdk', color: '#f89820', title: 'Java', sub: t('home.chips.java') },
  { cls: 'c3', icon: 'i-simple-icons-kubernetes', color: '#4f86ff', title: 'Kubernetes', sub: t('home.chips.kubernetes') },
  { cls: 'c4', icon: 'i-lucide-users', color: '#7da3ff', title: t('home.chips.community'), sub: t('home.chips.communitySub') },
])
</script>

<template>
  <section class="hero">
    <div>
      <p class="eyebrow">
        {{ t('home.role') }} <span class="sep">•</span> {{ t('home.community') }}
      </p>
      <h1 class="headline">
        {{ t('home.headline1') }}<br>
        <span class="accent">{{ t('home.headlineAccent') }}</span><br>
        {{ t('home.headline2') }}
      </h1>
      <p class="lede">
        {{ t('home.lede') }}
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <UButton
          :to="localePath('/blog')"
          :label="t('home.explore')"
          trailing-icon="i-lucide-arrow-right"
          size="xl"
          class="shadow-lg shadow-primary/25"
        />
        <UButton
          :to="localePath('/about')"
          :label="t('nav.about')"
          color="neutral"
          variant="outline"
          size="xl"
        />
      </div>
      <div class="who">
        <img src="/images/profile.png" :alt="t('site.title')" width="40" height="40">
        <div>
          <b>{{ t('site.title') }}</b><br>
          <span class="dot" />{{ t('home.now') }}
        </div>
      </div>
    </div>

    <div class="stage" aria-hidden="true">
      <svg class="sketch" viewBox="0 0 800 300" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="none">
        <path d="M0 210 L90 120 L130 150 L200 70 L260 140 L300 110 L360 180" opacity=".7" />
        <path d="M200 70 L185 110 M200 70 L215 100 M90 120 L80 150 M300 110 L290 140" opacity=".5" />
        <path d="M520 200 L600 110 L640 140 L700 80 L770 160 L800 140" opacity=".7" />
        <path d="M700 80 L688 115 M700 80 L712 112 M600 110 L592 135" opacity=".5" />
        <g opacity=".75">
          <path d="M40 240 l10 -34 l10 34 M44 226 h12 M42 234 h16 M50 240 v8" />
          <path d="M70 244 l8 -26 l8 26 M73 232 h10 M78 244 v6" />
          <path d="M700 236 l11 -38 l11 38 M704 220 h14 M702 229 h18 M711 236 v8" />
          <path d="M730 240 l9 -30 l9 30 M733 226 h12 M739 240 v7" />
          <path d="M760 238 l8 -24 l8 24 M768 238 v6" />
        </g>
        <path d="M0 252 C120 248 220 256 360 252 S620 248 800 254" opacity=".6" />
        <path d="M60 266 h120 M240 272 h90 M420 266 h150 M620 272 h110 M120 284 h70 M500 284 h90" opacity=".4" />
        <path d="M150 252 v14 M170 252 v14 M190 252 v14 M140 252 h70" opacity=".55" />
      </svg>

      <div class="words">
        <span v-for="w in words" :key="w">{{ w }}</span>
      </div>

      <div class="ide">
        <div class="bar">
          <i style="background:#ff5f57" /><i style="background:#febc2e" /><i style="background:#28c840" />
        </div>
        <div class="tabs">
          <span class="on">Application.java</span><span>pom.xml</span><span>compose.yaml</span>
        </div>
        <div class="code">
          <div class="ln">
            1<br>2<br>3<br>4<br>5<br>6
          </div>
          <div>
            <span class="an">@SpringBootApplication</span><br>
            <span class="kw">public class</span> <span class="ty">Application</span> {<br>
            &nbsp;&nbsp;<span class="kw">public static void</span> main(<span class="ty">String</span>[] args) {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span class="ty">SpringApplication</span>.run(<span class="ty">Application</span>.<span class="kw">class</span>, args);<br>
            &nbsp;&nbsp;}<br>
            }
          </div>
        </div>
        <div class="term">
          <div class="bar">
            <i style="background:#ff5f57" /><i style="background:#febc2e" /><i style="background:#28c840" />
            <span class="ml-1">zsh — ~/sukru</span>
          </div>
          <pre><span class="p">❯</span> whoami <span class="dim">{{ t('home.whoami') }}</span>
<span class="p">❯</span> cat now.md
<span class="y">building</span>  <span class="g">Oobeya</span> · <span class="y">speaking</span>  Akbank Pulse
<span class="p">❯</span> git push origin main <span class="cursor" /></pre>
        </div>
      </div>

      <div v-for="c in chips" :key="c.cls" class="chip float" :class="c.cls">
        <UIcon :name="c.icon" class="size-7 shrink-0" :style="{ color: c.color }" />
        <div><b>{{ c.title }}</b><small>{{ c.sub }}</small></div>
      </div>

      <div class="note">
        {{ t('home.note') }}
        <svg width="80" height="50" viewBox="0 0 80 50" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 44 C30 46 56 34 72 8" /><path d="M62 10 72 8 74 18" /></svg>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  --ide: #141823;
  --ide2: #1b2030;
  --ide-line: #2a3042;
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 36px;
  align-items: center;
  padding: 40px 0 24px;
  min-height: 540px;
}
.eyebrow {
  font: 600 12px/1.5 "JetBrains Mono", ui-monospace, monospace;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--ui-primary);
}
.eyebrow .sep { margin: 0 .5em; }
.headline {
  margin-top: 22px;
  font-weight: 800;
  font-size: clamp(40px, 4.9vw, 70px);
  line-height: 1.02;
  letter-spacing: -.045em;
  color: var(--ui-text-highlighted);
}
.headline .accent { color: var(--ui-primary); }
.lede {
  margin-top: 22px;
  max-width: 500px;
  font-size: 19px;
  line-height: 1.55;
  color: var(--ui-text-muted);
}
.who {
  margin-top: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--ui-text-muted);
}
.who img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 2px var(--ui-bg), 0 0 0 3px var(--ui-border);
}
.who b { color: var(--ui-text-highlighted); font-weight: 600; }
.who .dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  border-radius: 50%;
  background: #22a35a;
}

.stage { position: relative; height: 500px; }
.sketch {
  position: absolute;
  inset: auto -6% -10px -4%;
  height: 300px;
  width: 110%;
  color: var(--ui-border-accented);
  pointer-events: none;
}
.words {
  position: absolute;
  left: -2%;
  top: 70px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font: 26px/1 Caveat, "Segoe Print", cursive;
  color: var(--ui-text-dimmed);
  transform: rotate(-6deg);
}
.words span:nth-child(even) { margin-left: 8px; }
.ide {
  position: absolute;
  left: 15%;
  right: 6%;
  top: 52px;
  height: 360px;
  overflow: hidden;
  border-radius: 16px;
  background: var(--ide);
  color: #e6e9f2;
  font: 13.5px/1.75 "JetBrains Mono", ui-monospace, monospace;
  box-shadow: 0 50px 80px -40px rgba(15, 18, 34, .6), 0 0 0 1px rgba(255, 255, 255, .04) inset;
  transform: perspective(1400px) rotateY(-10deg) rotateX(4deg) rotateZ(-1.5deg);
  transform-origin: left center;
}
.ide .bar { display: flex; align-items: center; gap: 7px; padding: 12px 14px; }
.ide .bar i { width: 11px; height: 11px; border-radius: 50%; }
.tabs {
  display: flex;
  gap: 2px;
  padding: 0 12px;
  border-bottom: 1px solid var(--ide-line);
  font: 12px/1 var(--font-sans);
  color: #8f97ab;
}
.tabs span { padding: 10px 14px; }
.tabs .on { color: #fff; background: var(--ide2); border-radius: 8px 8px 0 0; box-shadow: inset 0 -2px 0 #5b8cff; }
.code {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  padding: 14px 16px 0;
  white-space: nowrap;
}
.ln { color: #525a70; text-align: right; }
.an { color: #ffd166; }
.kw { color: #ff8fa3; }
.ty { color: #7cc4ff; }
.term {
  position: absolute;
  left: 18px;
  bottom: 18px;
  width: 64%;
  overflow: hidden;
  border: 1px solid var(--ide-line);
  border-radius: 10px;
  background: #0d1018;
  font: 12.5px/1.7 "JetBrains Mono", ui-monospace, monospace;
}
.term .bar { padding: 8px 12px; border-bottom: 1px solid var(--ide-line); font: 11px/1 var(--font-sans); color: #737b90; }
.term .bar i { width: 9px; height: 9px; }
.term pre { padding: 10px 14px 12px; white-space: pre; }
.p { color: #5b8cff; }
.g { color: #7ee2a8; }
.y { color: #ffd166; }
.dim { color: #6c7489; }
.cursor {
  display: inline-block;
  width: 7px;
  height: 14px;
  vertical-align: -2px;
  background: #e6e9f2;
  animation: blink 1.1s steps(1) infinite;
}
@keyframes blink { 50% { opacity: 0; } }
.chip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
  padding: 12px 16px;
  border: 1px solid #30374b;
  border-radius: 12px;
  background: color-mix(in srgb, var(--ide2) 92%, transparent);
  color: #fff;
  box-shadow: 0 18px 36px -18px rgba(0, 0, 0, .6);
  backdrop-filter: blur(6px);
}
.chip b { display: block; font-size: 14.5px; font-weight: 600; line-height: 1.2; }
.chip small { font-size: 12px; line-height: 1.3; color: #a3abbf; }
.c1 { right: 9%; top: 6px; transform: rotate(-3deg); }
.c2 { right: 0; top: 142px; }
.c3 { right: 0; top: 222px; }
.c4 { right: 0; top: 302px; }
.note {
  position: absolute;
  right: 13%;
  bottom: 4px;
  max-width: 220px;
  font: 23px/1.15 Caveat, "Segoe Print", cursive;
  color: var(--ui-primary);
  transform: rotate(-8deg);
}
.note svg { position: absolute; right: -70px; top: 12px; }
.float { animation: float 6s ease-in-out infinite; }
.c3.float { animation-delay: -2s; }
.c4.float { animation-delay: -4s; }
@keyframes float { 50% { translate: 0 -6px; } }

@media (prefers-reduced-motion: reduce) {
  .float, .cursor { animation: none; }
}
@media (max-width: 1000px) {
  .hero { grid-template-columns: 1fr; min-height: 0; }
  .stage { height: 460px; }
}
@media (max-width: 640px) {
  .stage { height: 400px; overflow-x: clip; }
  .words, .note, .c1 { display: none; }
  .ide { left: 0; right: 0; top: 20px; transform: none; }
  .term { width: auto; right: 18px; }
  .chip { min-width: 0; padding: 8px 12px; }
  .chip small { display: none; }
  .c3 { display: none; }
  .c2 { top: auto; bottom: 0; right: auto; left: 4%; }
  .c4 { top: auto; bottom: 0; right: 4%; }
}
</style>
