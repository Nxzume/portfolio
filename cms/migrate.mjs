/**
 * Idempotent CMS migration — structured fields for normal editing in Directus.
 */
import { api, ensureCollection, ensureField, grantPublicRead, removeField, requireConfig, verifyToken } from './lib/directus.mjs'
import { COLLECTIONS, PUBLIC_COLLECTIONS } from './lib/schema.mjs'
import {
  aboutToDirectus,
  contactToDirectus,
  focusTabToDirectus,
  heroToDirectus,
  legacyGlobalsToStructured,
  loadContentFiles,
  projectToDirectus,
  sectionCopyToDirectus,
  siteToDirectus,
  sketchTrackToDirectus,
} from './lib/content-map.mjs'

requireConfig()
await verifyToken()

async function ensureSchema() {
  for (const def of Object.values(COLLECTIONS)) {
    await ensureCollection(def)
    for (const fieldDef of def.fields) {
      if (fieldDef.field === 'id') continue
      await ensureField(def.collection, fieldDef)
    }
  }
}

async function singletonHasData(collection) {
  try {
    const res = await api(`/items/${collection}`, 'GET')
    const row = res.data
    if (!row) return false
    return Object.entries(row).some(([key, value]) => {
      if (key === 'id') return false
      if (value == null || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    })
  } catch {
    return false
  }
}

async function collectionCount(collection) {
  const res = await api(`/items/${collection}?aggregate[count]=id`, 'GET')
  return Number(res.data?.[0]?.count?.id ?? 0)
}

async function migrateFromLegacyGlobals() {
  let globals = null
  try {
    const res = await api('/items/portfolio_globals', 'GET')
    globals = res.data
  } catch {
    return
  }

  if (!globals?.site && !globals?.hero) return

  console.log('Migrating legacy portfolio_globals → structured collections…')
  const structured = legacyGlobalsToStructured(globals)

  if (structured.site_settings) await api('/items/site_settings', 'PATCH', structured.site_settings)
  if (structured.hero) await api('/items/hero', 'PATCH', structured.hero)
  if (structured.about) await api('/items/about', 'PATCH', structured.about)
  if (structured.contact) await api('/items/contact', 'PATCH', structured.contact)
  if (structured.score_section) await api('/items/score_section', 'PATCH', structured.score_section)
  if (structured.projects_section) await api('/items/projects_section', 'PATCH', structured.projects_section)

  if ((await collectionCount('focus_tabs')) === 0 && structured.focus_tabs.length) {
    for (const tab of structured.focus_tabs) {
      await api('/items/focus_tabs', 'POST', tab)
    }
  }

  if ((await collectionCount('sketch_tracks')) === 0 && structured.sketch_tracks.length) {
    for (const track of structured.sketch_tracks) {
      await api('/items/sketch_tracks', 'POST', track)
    }
  }

  console.log('Legacy globals migration complete')
}

async function migrateLegacyProjects() {
  const res = await api('/items/projects?limit=-1', 'GET')
  let migrated = 0

  for (const row of res.data ?? []) {
    if (!row.payload || row.title) continue
    const patch = projectToDirectus(row.payload, row.sort ?? migrated + 1)
    await api(`/items/projects/${row.id}`, 'PATCH', {
      ...patch,
      slug: row.slug || patch.slug,
    })
    migrated += 1
  }

  if (migrated > 0) {
    console.log(`Migrated ${migrated} legacy project(s) from payload JSON`)
  }

  await removeField('projects', 'payload')
}

async function seedFromContentFiles() {
  const hasSite = await singletonHasData('site_settings')
  const hasProjects = await collectionCount('projects')

  if (hasSite && hasProjects > 0) {
    console.log('Structured content already present — skipping file seed')
    return
  }

  console.log('Seeding from content/*.json …')
  const content = await loadContentFiles()

  if (!hasSite) {
    await api('/items/site_settings', 'PATCH', siteToDirectus(content.site))
    await api('/items/hero', 'PATCH', heroToDirectus(content.hero))
    await api('/items/about', 'PATCH', aboutToDirectus(content.about))
    await api('/items/contact', 'PATCH', contactToDirectus(content.contact))
    await api('/items/score_section', 'PATCH', sectionCopyToDirectus(content.score))
    await api('/items/projects_section', 'PATCH', sectionCopyToDirectus(content.projectsSection))
  }

  if ((await collectionCount('focus_tabs')) === 0) {
    for (const [i, tab] of content.focuses.tabs.entries()) {
      await api('/items/focus_tabs', 'POST', focusTabToDirectus(tab, i + 1))
    }
  }

  if ((await collectionCount('sketch_tracks')) === 0) {
    for (const [i, track] of content.sketches.tracks.entries()) {
      await api('/items/sketch_tracks', 'POST', sketchTrackToDirectus(track, i + 1))
    }
  }

  if (hasProjects === 0) {
    for (const [i, project] of content.projects.entries()) {
      await api('/items/projects', 'POST', projectToDirectus(project, i + 1))
    }
  }

  console.log('File seed complete')
}

async function cleanupLegacySchema() {
  const legacyFields = ['site', 'hero', 'about', 'contact', 'focuses', 'sketches', 'score', 'projects_section']
  for (const field of legacyFields) {
    await removeField('portfolio_globals', field)
  }
}

async function ensurePermissions() {
  for (const collection of PUBLIC_COLLECTIONS) {
    await grantPublicRead(collection)
  }
}

console.log('CMS migrate starting…')
await ensureSchema()
await migrateFromLegacyGlobals()
await migrateLegacyProjects()
await seedFromContentFiles()
await cleanupLegacySchema()
await ensurePermissions()
console.log('CMS migrate done.')
