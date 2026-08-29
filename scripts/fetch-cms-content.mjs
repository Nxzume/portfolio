/**
 * Runs before `vite build`. Fetches this site's published content from its
 * client-site-cms instance and writes it into content/*.json — the exact
 * same files the app already statically imports (src/content/index.ts is
 * unchanged). This replaces the old flow where Decap CMS committed these
 * files to GitHub directly.
 *
 * Required env (set as Coolify build-time vars on the -web app):
 *   CMS_API_URL     e.g. https://pilot-admin.vancouverly.ca
 *   CMS_PUBLIC_KEY  same value as PUBLIC_API_KEY on that CMS instance
 *
 * Content only updates here — i.e. on the next build. After an editor hits
 * Publish in the CMS admin, redeploy this app (or wire a Coolify webhook) to
 * pick it up.
 */
import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'

const CMS_API_URL = (process.env.CMS_API_URL || '').replace(/\/+$/, '')
const CMS_PUBLIC_KEY = process.env.CMS_PUBLIC_KEY || ''
const CONTENT_DIR = path.resolve('content')

const GLOBAL_FILES = {
  site: 'site.json',
  hero: 'hero.json',
  about: 'about.json',
  contact: 'contact.json',
  focuses: 'focuses.json',
  sketches: 'sketches.json',
  score: 'score.json',
  projectsSection: 'projects-section.json',
}

async function fetchJson(pathname) {
  const res = await fetch(`${CMS_API_URL}${pathname}`, {
    headers: { 'X-Api-Key': CMS_PUBLIC_KEY },
  })
  if (!res.ok) {
    throw new Error(`CMS request failed: ${pathname} -> ${res.status} ${res.statusText}`)
  }
  return res.json()
}

async function writeJsonFile(file, data) {
  await writeFile(path.join(CONTENT_DIR, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function main() {
  if (!CMS_API_URL || !CMS_PUBLIC_KEY) {
    console.log(
      'CMS_API_URL / CMS_PUBLIC_KEY not set — skipping CMS fetch, using content/*.json already on disk.'
    )
    return
  }

  console.log(`Fetching content from ${CMS_API_URL} ...`)

  const globalsRes = await fetchJson('/api/public/globals')
  const globals = globalsRes.data || {}

  for (const [key, file] of Object.entries(GLOBAL_FILES)) {
    await writeJsonFile(file, globals[key] ?? {})
  }

  const projectsRes = await fetchJson('/api/public/collections/projects')
  const items = projectsRes.items || []

  const projectsDir = path.join(CONTENT_DIR, 'projects')
  await rm(projectsDir, { recursive: true, force: true })
  await mkdir(projectsDir, { recursive: true })

  for (const item of items) {
    const slug = item.slug
    const payload = item.data?.payload ?? {}
    await writeFile(
      path.join(projectsDir, `${slug}.json`),
      `${JSON.stringify(payload, null, 2)}\n`,
      'utf8'
    )
  }

  console.log(`Wrote ${Object.keys(GLOBAL_FILES).length} global file(s) and ${items.length} project(s).`)
}

await main()
