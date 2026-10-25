// Posts dated after today (Europe/Istanbul) are left out of the build entirely
// — not listed, not prerendered, not in the client content dump. The daily
// scheduled deploy publishes each one on its date. SHOW_SCHEDULED=1 previews them.
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const contentDir = fileURLToPath(new URL('./content', import.meta.url))

export function todayInIstanbul(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date())
}

// Content-relative paths (e.g. `tr/blog/x.md`) of not-yet-published posts.
export function scheduledPosts(): string[] {
  if (process.env.SHOW_SCHEDULED) return []
  const today = todayInIstanbul()
  const scheduled: string[] = []
  for (const loc of ['tr', 'en']) {
    let files: string[] = []
    try {
      files = readdirSync(`${contentDir}/${loc}/blog`)
    } catch {
      continue
    }
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const source = readFileSync(`${contentDir}/${loc}/blog/${file}`, 'utf8')
      const date = source.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1]
      if (date && date > today) scheduled.push(`${loc}/blog/${file}`)
    }
  }
  return scheduled
}
