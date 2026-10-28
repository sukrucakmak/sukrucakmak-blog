// Static homepage data: featured talks, career timeline and post-cover themes.

type Localized = { tr: string, en: string }

export interface HomeEvent {
  date: string
  title: Localized
  role: Localized
  url?: string
  video?: string
}

export const featuredTalk = {
  date: '2026-10-07',
  title: 'Oobeya & Sonar — From AI-Generated Code to Trusted Code',
  kind: 'Webinar',
  youtubeId: 'Gb2r1uot7ew',
}

export const recentEvents: HomeEvent[] = [
  {
    date: '2026-10-08',
    title: {
      tr: 'Akbank Teknoloji Pulse — Yapay zekâ çağında yazılım verimliliği',
      en: 'Akbank Teknoloji Pulse — Software productivity in the AI era',
    },
    role: { tr: 'Konuşmacı', en: 'Speaker' },
    url: 'https://www.linkedin.com/posts/akbankteknoloji_akbankteknolojininfark%C4%B1-activity-7518676713883598848-4F5G',
  },
  {
    date: '2026-07-08',
    title: { tr: 'Blamely by Oobeya lansmanı', en: 'Blamely by Oobeya launch' },
    role: { tr: 'Konuşmacı', en: 'Speaker' },
    url: 'https://oobeya.io/events/ai-coding-attribution-blamely-oobeya',
    video: 'https://www.youtube.com/watch?v=OifkmwXWoog',
  },
  {
    date: '2026-06-22',
    title: {
      tr: 'Engineering Visibility Stories #2 — Oobeya & Microsoft',
      en: 'Engineering Visibility Stories #2 — Oobeya & Microsoft',
    },
    role: { tr: 'Konuşmacı', en: 'Speaker' },
    url: 'https://oobeya.io/events/engineering-visibility-stories-microsoft',
    video: 'https://www.youtube.com/watch?v=t1W7EgRT5nQ',
  },
  {
    date: '2026-04-15',
    title: { tr: 'Tech Leaders Summit 2026 — İstanbul', en: 'Tech Leaders Summit 2026 — Istanbul' },
    role: { tr: 'Panelist', en: 'Panelist' },
    url: 'https://devnot.com/haber/tech-leaders-summit-2026-15-nisan-da-gerceklesiyor',
    video: 'https://www.youtube.com/watch?v=Q9Zxo7-Me_M',
  },
]

export interface JourneyStep {
  year: Localized
  org: Localized
  role: Localized
  current?: boolean
}

export const journey: JourneyStep[] = [
  {
    year: { tr: '2008', en: '2008' },
    org: { tr: 'Kadir Has Üni.', en: 'Kadir Has Univ.' },
    role: { tr: 'Araştırma görevlisi', en: 'Research assistant' },
  },
  {
    year: { tr: '2011', en: '2011' },
    org: { tr: 'i2i Systems', en: 'i2i Systems' },
    role: { tr: 'Turkcell, Vodafone, TT billing', en: 'Turkcell, Vodafone, TT billing' },
  },
  {
    year: { tr: '2017', en: '2017' },
    org: { tr: 'Türk Hava Yolları', en: 'Turkish Airlines' },
    role: { tr: 'Yazılım mimarı', en: 'Software architect' },
  },
  {
    year: { tr: '2018', en: '2018' },
    org: { tr: 'Vakıfbank', en: 'Vakıfbank' },
    role: { tr: 'Çözüm mimarı', en: 'Solution architect' },
  },
  {
    year: { tr: '2020', en: '2020' },
    org: { tr: 'ATEZ', en: 'ATEZ' },
    role: { tr: 'CTO', en: 'CTO' },
  },
  {
    year: { tr: '2022 — bugün', en: '2022 — today' },
    org: { tr: 'Oobeya', en: 'Oobeya' },
    role: { tr: 'Kurucu ortak & CTO', en: 'Co-founder & CTO' },
    current: true,
  },
]

export interface CoverLine {
  cmd?: string
  out?: string
}

export interface CoverTheme {
  icon: string
  iconColor: string
  from: string
  to: string
  lines: CoverLine[]
}

// First matching tag wins; order goes from most to least specific.
const coverThemes: Array<{ tags: string[], theme: CoverTheme }> = [
  {
    tags: ['nginx'],
    theme: {
      icon: 'i-simple-icons-nginx', iconColor: '#22c55e', from: '#0f5132', to: '#0a1f17',
      lines: [{ cmd: 'sudo nginx -t' }, { cmd: 'sudo certbot --nginx \\' }, { out: '    -d sukrucakmak.com' }, { cmd: 'systemctl reload nginx' }, { out: '✓ https://' }],
    },
  },
  {
    tags: ['docker'],
    theme: {
      icon: 'i-simple-icons-docker', iconColor: '#ffffff', from: '#1d4ed8', to: '#0b1633',
      lines: [{ cmd: 'docker compose up -d' }, { cmd: 'docker compose ps' }, { out: 'api    running  :8080' }, { out: 'db     healthy  :5432' }, { out: 'redis  running  :6379' }],
    },
  },
  {
    tags: ['kubernetes'],
    theme: {
      icon: 'i-simple-icons-kubernetes', iconColor: '#ffffff', from: '#2a4fa8', to: '#0d1530',
      lines: [{ cmd: 'kubectl get pods' }, { cmd: 'kubectl logs -f api' }, { cmd: 'kubectl rollout status \\' }, { out: '    deploy/api' }, { cmd: 'kubectl port-forward …' }],
    },
  },
  {
    tags: ['git', 'github'],
    theme: {
      icon: 'i-simple-icons-git', iconColor: '#f05032', from: '#7c2d12', to: '#1c0d07',
      lines: [{ cmd: 'git switch -c feature/x' }, { cmd: 'git add -p' }, { cmd: 'git commit -m "fix: …"' }, { cmd: 'git push -u origin HEAD' }],
    },
  },
  {
    tags: ['pm2', 'nodejs'],
    theme: {
      icon: 'i-simple-icons-pm2', iconColor: '#ffffff', from: '#4c1d95', to: '#140a2b',
      lines: [{ cmd: 'pm2 start app.js -i max' }, { cmd: 'pm2 list' }, { cmd: 'pm2 logs api' }, { cmd: 'pm2 save' }],
    },
  },
  {
    tags: ['spring'],
    theme: {
      icon: 'i-simple-icons-spring', iconColor: '#6db33f', from: '#166534', to: '#0a1a10',
      lines: [{ cmd: './mvnw spring-boot:run' }, { out: 'Tomcat started on :8080' }, { out: 'Started Application' }],
    },
  },
  {
    tags: ['linux', 'systemd', 'ssh'],
    theme: {
      icon: 'i-simple-icons-linux', iconColor: '#facc15', from: '#334155', to: '#0b1120',
      lines: [{ cmd: 'ssh deploy@server' }, { cmd: 'systemctl status app' }, { cmd: 'journalctl -u app -f' }, { cmd: 'df -h' }],
    },
  },
  {
    tags: ['java', 'jsf', 'application servers', 'glassfish', 'xml', 'web service'],
    theme: {
      icon: 'i-simple-icons-openjdk', iconColor: '#ffffff', from: '#9a3412', to: '#1c0f07',
      lines: [{ cmd: 'javac Main.java' }, { cmd: 'java Main' }, { out: 'Hello, World!' }],
    },
  },
]

const defaultCover: CoverTheme = {
  icon: 'i-lucide-terminal', iconColor: '#ffffff', from: '#1e3a8a', to: '#0b1633',
  lines: [{ cmd: 'cat notes.md' }, { out: '# Java · Spring · DevOps' }],
}

export function coverFor(tags?: string[]): CoverTheme {
  const set = new Set((tags ?? []).map(t => t.toLowerCase()))
  return coverThemes.find(c => c.tags.some(t => set.has(t)))?.theme ?? defaultCover
}

export function eventDateParts(date: string, locale: string) {
  const d = new Date(`${date}T12:00:00`)
  const loc = locale === 'tr' ? 'tr-TR' : 'en-US'
  return {
    day: d.toLocaleDateString(loc, { day: '2-digit' }),
    month: d.toLocaleDateString(loc, { month: 'short' }).replace('.', ''),
  }
}
