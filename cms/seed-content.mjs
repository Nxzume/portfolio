/**
 * Seeds a fresh Directus instance from the content/*.json files already in
 * this repo — a one-time migration so the CMS starts with exactly what's
 * live today, rather than empty.
 *
 * Usage: DIRECTUS_URL=... DIRECTUS_TOKEN=... node cms/seed-content.mjs
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://localhost:8055').replace(/\/+$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN
if (!TOKEN) throw new Error('DIRECTUS_TOKEN is required')
const CONTENT_DIR = path.resolve('content')

async function api(path, method, body) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`)
  return json
}

async function readJson(file) {
  return JSON.parse(await readFile(path.join(CONTENT_DIR, file), 'utf8'))
}

const globals = {
  site: await readJson('site.json'),
  hero: await readJson('hero.json'),
  about: await readJson('about.json'),
  contact: await readJson('contact.json'),
  focuses: await readJson('focuses.json'),
  sketches: await readJson('sketches.json'),
  score: await readJson('score.json'),
  projects_section: await readJson('projects-section.json'),
}
await api('/items/portfolio_globals', 'PATCH', globals)
console.log('Seeded portfolio_globals')

const projectsDir = path.join(CONTENT_DIR, 'projects')
const files = (await readdir(projectsDir)).filter((f) => f.endsWith('.json'))
let i = 0
for (const file of files) {
  const payload = await readJson(path.join('projects', file))
  const slug = String(payload.slug ?? file.replace(/\.json$/, ''))
  await api('/items/projects', 'POST', { slug, payload, sort: ++i })
}
console.log(`Seeded ${files.length} project(s)`)

console.log('Done.')
