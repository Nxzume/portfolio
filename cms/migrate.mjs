/**
 * Idempotent CMS migration — structured fields for normal editing in Directus.
 */
import {
  api,
  ensureCollection,
  ensureField,
  ensureFileField,
  ensureFileRelation,
  grantPublicRead,
  removeField,
  requireConfig,
  verifyToken,
} from './lib/directus.mjs'
import { COLLECTIONS, FILE_RELATION_FIELDS, PUBLIC_COLLECTIONS } from './lib/schema.mjs'
import { isMediaPath, isUuid, rewriteMediaFieldsToFileIds } from './lib/media.mjs'
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

const uploadCache = new Map()

function fieldDef(collection, field) {
  return COLLECTIONS[collection].fields.find((f) => f.field === field)
}

async function ensureSchema() {
  for (const def of Object.values(COLLECTIONS)) {
    await ensureCollection(def)
    for (const fieldDefItem of def.fields) {
      if (fieldDefItem.field === 'id') continue
      const isFileRelation = FILE_RELATION_FIELDS.some(
        (f) => f.collection === def.collection && f.field === fieldDefItem.field,
      )
      if (isFileRelation) {
        await ensureFileField(def.collection, fieldDefItem)
      } else {
        await ensureField(def.collection, fieldDefItem)
        // Refresh list field meta so nested image pickers become file-image
        if (fieldDefItem.type === 'json' && fieldDefItem.meta?.interface === 'list') {
          try {
            await api(`/fields/${def.collection}/${fieldDefItem.field}`, 'PATCH', {
              meta: fieldDefItem.meta,
            })
          } catch {
            // non-fatal — field may already match
          }
        }
      }
    }
  }
}

/**
 * Convert legacy string path media fields → uuid file fields, uploading assets.
 */
async function migrateStringFileFields() {
  for (const { collection, field } of FILE_RELATION_FIELDS) {
    const def = fieldDef(collection, field)
    if (!def) continue
    const result = await ensureFileField(collection, def)
    if (!result.needsPathMigration) continue

    console.log(`Converting ${collection}.${field} string → file…`)

    const isSingleton = COLLECTIONS[collection]?.meta?.singleton
    let rows = []
    if (isSingleton) {
      const res = await api(`/items/${collection}`, 'GET')
      if (res.data) rows = [res.data]
    } else {
      const res = await api(`/items/${collection}?limit=-1`, 'GET')
      rows = res.data ?? []
    }

    const pathById = new Map()
    for (const row of rows) {
      const value = row[field]
      if (typeof value === 'string' && (isMediaPath(value) || value.startsWith('/'))) {
        pathById.set(row.id, value)
      }
    }

    await removeField(collection, field)
    await api(`/fields/${collection}`, 'POST', def)
    console.log(`Recreated file field: ${collection}.${field}`)
    await ensureFileRelation(collection, field)

    for (const [id, mediaPath] of pathById) {
      try {
        const fileId = await rewriteMediaFieldsToFileIds({ [field]: mediaPath }, uploadCache).then(
          (o) => o[field],
        )
        if (isSingleton) {
          await api(`/items/${collection}`, 'PATCH', { [field]: fileId })
        } else {
          await api(`/items/${collection}/${id}`, 'PATCH', { [field]: fileId })
        }
        console.log(`  Set ${collection}.${field} → ${fileId}`)
      } catch (err) {
        console.warn(`  Warning: could not migrate ${collection} id=${id} ${field}=${mediaPath}: ${err.message}`)
      }
    }
  }
}

/** Rewrite path strings inside JSON galleries / sections / audio leftovers to file UUIDs. */
async function migrateEmbeddedMediaPaths() {
  console.log('Converting embedded media paths (gallery, sections, …) to file UUIDs…')

  // Projects: image (if still path somehow), gallery, sections
  const projects = (await api('/items/projects?limit=-1', 'GET')).data ?? []
  for (const row of projects) {
    const rewritten = await rewriteMediaFieldsToFileIds(
      {
        image: row.image,
        gallery: row.gallery,
        sections: row.sections,
      },
      uploadCache,
    )
    const patch = {}
    if (rewritten.image !== row.image && (isUuid(rewritten.image) || rewritten.image === '' || rewritten.image == null)) {
      patch.image = rewritten.image || null
    }
    if (JSON.stringify(rewritten.gallery) !== JSON.stringify(row.gallery)) patch.gallery = rewritten.gallery
    if (JSON.stringify(rewritten.sections) !== JSON.stringify(row.sections)) patch.sections = rewritten.sections
    if (Object.keys(patch).length) {
      await api(`/items/projects/${row.id}`, 'PATCH', patch)
      console.log(`  Updated project ${row.slug || row.id} media refs`)
    }
  }

  // Hero / about singletons (in case string→uuid conversion already done but values still paths)
  for (const { collection, fields } of [
    { collection: 'hero', fields: ['image'] },
    { collection: 'about', fields: ['portrait'] },
  ]) {
    try {
      const row = (await api(`/items/${collection}`, 'GET')).data
      if (!row) continue
      const slice = Object.fromEntries(fields.map((f) => [f, row[f]]))
      const rewritten = await rewriteMediaFieldsToFileIds(slice, uploadCache)
      const patch = {}
      for (const f of fields) {
        if (typeof row[f] === 'string' && isMediaPath(row[f]) && rewritten[f] !== row[f]) {
          patch[f] = rewritten[f]
        }
      }
      if (Object.keys(patch).length) {
        await api(`/items/${collection}`, 'PATCH', patch)
        console.log(`  Updated ${collection} media refs`)
      }
    } catch (err) {
      console.warn(`  Warning updating ${collection}: ${err.message}`)
    }
  }

  const tracks = (await api('/items/sketch_tracks?limit=-1', 'GET')).data ?? []
  for (const row of tracks) {
    if (typeof row.audio === 'string' && isMediaPath(row.audio)) {
      const rewritten = await rewriteMediaFieldsToFileIds({ audio: row.audio }, uploadCache)
      await api(`/items/sketch_tracks/${row.id}`, 'PATCH', { audio: rewritten.audio })
      console.log(`  Updated sketch_tracks ${row.track_id || row.id} audio`)
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
  if (structured.hero) {
    const hero = await rewriteMediaFieldsToFileIds(structured.hero, uploadCache)
    await api('/items/hero', 'PATCH', hero)
  }
  if (structured.about) {
    const about = await rewriteMediaFieldsToFileIds(structured.about, uploadCache)
    await api('/items/about', 'PATCH', about)
  }
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
      const row = await rewriteMediaFieldsToFileIds(track, uploadCache)
      await api('/items/sketch_tracks', 'POST', row)
    }
  }

  console.log('Legacy globals migration complete')
}

async function migrateLegacyProjects() {
  const res = await api('/items/projects?limit=-1', 'GET')
  let migrated = 0

  for (const row of res.data ?? []) {
    if (!row.payload || row.title) continue
    const patch = await rewriteMediaFieldsToFileIds(
      projectToDirectus(row.payload, row.sort ?? migrated + 1),
      uploadCache,
    )
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

  console.log('Seeding from content/*.json (uploading media to Directus)…')
  const content = await loadContentFiles()

  if (!hasSite) {
    await api('/items/site_settings', 'PATCH', siteToDirectus(content.site))
    await api(
      '/items/hero',
      'PATCH',
      await rewriteMediaFieldsToFileIds(heroToDirectus(content.hero), uploadCache),
    )
    await api(
      '/items/about',
      'PATCH',
      await rewriteMediaFieldsToFileIds(aboutToDirectus(content.about), uploadCache),
    )
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
      const row = await rewriteMediaFieldsToFileIds(sketchTrackToDirectus(track, i + 1), uploadCache)
      await api('/items/sketch_tracks', 'POST', row)
    }
  }

  if (hasProjects === 0) {
    for (const [i, project] of content.projects.entries()) {
      const row = await rewriteMediaFieldsToFileIds(projectToDirectus(project, i + 1), uploadCache)
      await api('/items/projects', 'POST', row)
    }
  }

  console.log('File seed complete')
}

/** Replace stale preview/hosting URLs (e.g. old Vercel) with the live site URL. */
async function normalizeSiteUrl() {
  const expected = (process.env.SITE_URL || 'https://alexandreguichet.vancouverly.ca').replace(/\/+$/, '')
  let row
  try {
    row = (await api('/items/site_settings', 'GET')).data
  } catch {
    return
  }
  if (!row) return

  const current = String(row.url || '').trim().replace(/\/+$/, '')
  // Only auto-fix known stale hosts; leave intentional custom domains alone.
  const shouldFix =
    !current || /vercel\.app/i.test(current) || /portfolio-five-steel/i.test(current)

  if (!shouldFix) {
    if (current !== expected) {
      console.log(`site_settings.url is ${current} (leaving as-is; expected default ${expected})`)
    }
    return
  }

  await api('/items/site_settings', 'PATCH', { url: expected })
  console.log(`Updated site_settings.url: ${current || '(empty)'} → ${expected}`)
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
  // Public asset URLs (/assets/:id) need read on directus_files
  await grantPublicRead('directus_files')
}

console.log('CMS migrate starting…')
await ensureSchema()
await migrateStringFileFields()
await migrateFromLegacyGlobals()
await migrateLegacyProjects()
await seedFromContentFiles()
await migrateEmbeddedMediaPaths()
await normalizeSiteUrl()
await cleanupLegacySchema()
await ensurePermissions()
console.log('CMS migrate done.')
