/**
 * Runs before `vite build`. Fetches this site's published content from
 * Directus and writes it into content/*.json — the exact same files
 * src/content/index.ts already statically imports, so no component needs
 * to change.
 *
 * Required env (set as Coolify build-time vars on the -web app):
 *   DIRECTUS_URL   e.g. https://alexandreguichet-cms.vancouverly.ca
 *
 * portfolio_globals and projects both have public read access, so no API
 * key is needed for this fetch.
 *
 * Content only updates on the next build — after publishing in Directus,
 * redeploy this app (or wire a Coolify webhook) to pick it up.
 */
import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'

const DIRECTUS_URL = (process.env.DIRECTUS_URL || '').replace(/\/+$/, '')
const CONTENT_DIR = path.resolve('content')

const GLOBAL_FILES = {
  site: 'site.json',
  hero: 'hero.json',
  about: 'about.json',
  contact: 'contact.json',
  focuses: 'focuses.json',
  sketches: 'sketches.json',
  score: 'score.json',
  projects_section: 'projects-section.json',
}

async function fetchJson(pathname) {
  const res = await fetch(`${DIRECTUS_URL}${pathname}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`Directus request failed: ${pathname} -> ${res.status} ${res.statusText}`)
  }
  return res.json()
}

async function writeJsonFile(file, data) {
  await writeFile(path.join(CONTENT_DIR, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function main() {
  if (!DIRECTUS_URL) {
    console.log('DIRECTUS_URL not set — skipping CMS fetch, using content/*.json already on disk.')
    return
  }

  console.log(`Fetching content from ${DIRECTUS_URL} ...`)

  const globalsRes = await fetchJson('/items/portfolio_globals')
  const globals = globalsRes.data || {}

  for (const [key, file] of Object.entries(GLOBAL_FILES)) {
    await writeJsonFile(file, globals[key] ?? {})
  }

  const projectsRes = await fetchJson('/items/projects?sort=sort&limit=-1')
  const items = projectsRes.data || []

  const projectsDir = path.join(CONTENT_DIR, 'projects')
  await rm(projectsDir, { recursive: true, force: true })
  await mkdir(projectsDir, { recursive: true })

  for (const item of items) {
    const slug = item.slug
    const payload = item.payload ?? {}
    await writeFile(path.join(projectsDir, `${slug}.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  }

  console.log(`Wrote ${Object.keys(GLOBAL_FILES).length} global file(s) and ${items.length} project(s).`)
}

await main()
