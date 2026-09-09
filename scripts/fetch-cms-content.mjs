/**
 * Runs before `vite build`. Fetches structured Directus content and writes
 * content/*.json for the static site build. Media file fields are downloaded
 * into public/media/ and rewritten as local paths.
 */
import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import {
  aboutFromDirectus,
  contactFromDirectus,
  focusesFromDirectus,
  heroFromDirectus,
  projectFromDirectus,
  sectionCopyFromDirectus,
  siteFromDirectus,
  sketchesFromDirectus,
} from '../cms/lib/content-map.mjs'
import { rewriteMediaFieldsToPublicPaths } from '../cms/lib/media.mjs'

const DIRECTUS_URL = (process.env.DIRECTUS_URL || '').replace(/\/+$/, '')
const CONTENT_DIR = path.resolve('content')

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

async function fetchSingleton(collection, fields = '*') {
  const q = fields === '*' ? '' : `?fields=${encodeURIComponent(fields)}`
  const res = await fetchJson(`/items/${collection}${q}`)
  return res.data ?? {}
}

async function materialize(data, opts) {
  return rewriteMediaFieldsToPublicPaths(data, opts)
}

async function main() {
  if (!DIRECTUS_URL) {
    console.log('DIRECTUS_URL not set — skipping CMS fetch, using content/*.json already on disk.')
    return
  }

  console.log(`Fetching content from ${DIRECTUS_URL} …`)
  const mediaOpts = { directusUrl: DIRECTUS_URL, usedNames: new Set() }

  const hero = await materialize(
    heroFromDirectus(await fetchSingleton('hero', '*,image.id,image.filename_download,image.type')),
    mediaOpts,
  )
  await writeJsonFile('hero.json', hero)

  const about = await materialize(
    aboutFromDirectus(await fetchSingleton('about', '*,portrait.id,portrait.filename_download,portrait.type')),
    mediaOpts,
  )
  await writeJsonFile('about.json', about)

  await writeJsonFile('site.json', siteFromDirectus(await fetchSingleton('site_settings')))
  await writeJsonFile('contact.json', contactFromDirectus(await fetchSingleton('contact')))
  await writeJsonFile('score.json', sectionCopyFromDirectus(await fetchSingleton('score_section')))
  await writeJsonFile(
    'projects-section.json',
    sectionCopyFromDirectus(await fetchSingleton('projects_section')),
  )

  const focusRes = await fetchJson('/items/focus_tabs?sort=sort&limit=-1')
  await writeJsonFile('focuses.json', focusesFromDirectus(focusRes.data ?? []))

  const sketchRes = await fetchJson(
    '/items/sketch_tracks?sort=sort&limit=-1&fields=*,audio.id,audio.filename_download,audio.type',
  )
  const sketches = await materialize(sketchesFromDirectus(sketchRes.data ?? []), mediaOpts)
  await writeJsonFile('sketches.json', sketches)

  const projectsRes = await fetchJson(
    '/items/projects?sort=sort&limit=-1&fields=*,image.id,image.filename_download,image.type',
  )
  const items = projectsRes.data ?? []

  const projectsDir = path.join(CONTENT_DIR, 'projects')
  await rm(projectsDir, { recursive: true, force: true })
  await mkdir(projectsDir, { recursive: true })

  for (const item of items) {
    const payload = await materialize(projectFromDirectus(item), mediaOpts)
    const slug = payload.slug || item.slug
    if (!slug) continue
    await writeFile(path.join(projectsDir, `${slug}.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  }

  console.log(`Wrote 8 global file(s) and ${items.length} project(s); media under public/media/.`)
}

await main()
