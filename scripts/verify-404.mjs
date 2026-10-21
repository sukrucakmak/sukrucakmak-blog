// Sanity checks for the prerendered custom 404 page that nginx serves via
// `error_page 404 /404.html`. Run after `npm run generate`.
import { readFileSync } from 'node:fs'

const file = new URL('../.output/public/404.html', import.meta.url)
const html = readFileSync(file, 'utf8')

const checks = [
  ['title is "404 — Sayfa bulunamadı"', /<title>404 — Sayfa bulunamadı[^<]*<\/title>/.test(html)],
  ['page is server-rendered (not an empty SPA shell)', /<h1[^>]*>404 — Sayfa bulunamadı<\/h1>/.test(html)],
  ['has a short description', html.includes('Aradığınız sayfa taşınmış')],
  ['"Ana sayfaya dön" links to the homepage', /<a href="\/"[^>]*>(?:(?!<\/a>).)*Ana sayfaya dön/s.test(html)],
  ['no automatic redirect (meta refresh)', !/http-equiv=["']?refresh/i.test(html)],
  ['marked noindex', /<meta name="robots" content="noindex"/.test(html)],
]

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? '✔' : '✘'} ${name}`)
  if (!ok) failed++
}
if (failed) {
  console.error(`\n${failed} check(s) failed for ${file.pathname}`)
  process.exit(1)
}
