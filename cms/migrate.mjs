/**
 * Idempotent CMS migration — structured fields for normal editing in Directus.
 */
import {
  api,
  assertFileRelations,
  ensureCollection,
  ensureField,
  ensureFileField,
  ensureFileRelation,
  ensureProjectGalleryFilesField,
  ensureProjectSectionsCollection,
  getField,
  grantPublicRead,
  removeField,
  repairFileField,
  requireConfig,
  verifyToken,
} from './lib/directus.mjs'
import { COLLECTIONS, FILE_RELATION_FIELDS, PUBLIC_COLLECTIONS } from './lib/schema.mjs'
import { isMediaPath, isUuid, rewriteMediaFieldsToFileIds, ensurePathUploaded } from './lib/media.mjs'
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
        if (fieldDefItem.type === 'json' && fieldDefItem.meta?.interface === 'list') {
          try {
            await api(`/fields/${def.collection}/${fieldDefItem.field}`, 'PATCH', {
              meta: fieldDefItem.meta,
            })
          } catch {
            // non-fatal
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
        const fileId = await ensurePathUploaded(mediaPath, uploadCache)
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

async function repairAllFileFields() {
  console.log('Repairing Directus file field configuration…')
  for (const { collection, field } of FILE_RELATION_FIELDS) {
    const def = fieldDef(collection, field)
    if (!def) continue
    await repairFileField(collection, def)
  }
  // Section images also need a working file relation
  await ensureFileRelation('project_sections', 'image').catch(() => {
    // collection may not exist yet — created later
  })
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
  try {
    const res = await api(`/items/${collection}?aggregate[count]=id`, 'GET')
    return Number(res.data?.[0]?.count?.id ?? 0)
  } catch {
    return 0
  }
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
      const created = await api('/items/projects', 'POST', row)
      const projectId = created.data?.id
      if (projectId) {
        await seedProjectRelations(projectId, project)
      }
    }
  }

  console.log('File seed complete')
}

async function seedProjectRelations(projectId, project) {
  for (const [i, item] of (project.gallery ?? []).entries()) {
    const path = typeof item === 'string' ? item : item?.image
    if (!path || !isMediaPath(path)) continue
    try {
      const fileId = await ensurePathUploaded(path, uploadCache)
      await api('/items/projects_gallery', 'POST', {
        projects_id: projectId,
        directus_files_id: fileId,
        sort: i + 1,
      })
    } catch (err) {
      console.warn(`  Warning seeding gallery for project ${projectId}: ${err.message}`)
    }
  }

  for (const [i, section] of (project.sections ?? []).entries()) {
    try {
      let imageId = null
      if (section.image && isMediaPath(section.image)) {
        imageId = await ensurePathUploaded(section.image, uploadCache)
      } else if (section.image && isUuid(section.image)) {
        imageId = section.image
      }
      await api('/items/project_sections', 'POST', {
        project: projectId,
        sort: i + 1,
        section_id: section.id ?? '',
        title: section.title ?? '',
        image: imageId,
        image_alt: section.imageAlt ?? '',
        quote: section.quote ?? '',
        paragraphs: section.paragraphs ?? [],
      })
    } catch (err) {
      console.warn(`  Warning seeding section for project ${projectId}: ${err.message}`)
    }
  }
}

/** Convert projects.gallery JSON list → Files M2M junction rows. */
async function migrateProjectGalleryToFiles() {
  console.log('Migrating projects.gallery → Files (M2M)…')
  const field = await getField('projects', 'gallery')
  const projects = (await api('/items/projects?limit=-1', 'GET')).data ?? []

  // Capture JSON values before converting the field
  const pending = []
  if (field?.type === 'json') {
    for (const row of projects) {
      const gallery = Array.isArray(row.gallery) ? row.gallery : []
      pending.push({ projectId: row.id, slug: row.slug, gallery })
    }
  }

  await ensureProjectGalleryFilesField()

  if (!pending.length) {
    // Field already Files — maybe seed empty galleries from content
    await reseedGalleriesFromContent(projects)
    return
  }

  for (const { projectId, slug, gallery } of pending) {
    let sort = 1
    for (const item of gallery) {
      const pathOrId = typeof item === 'string' ? item : item?.image
      if (!pathOrId) continue
      try {
        const fileId = isUuid(pathOrId)
          ? pathOrId
          : await ensurePathUploaded(pathOrId, uploadCache)
        await api('/items/projects_gallery', 'POST', {
          projects_id: projectId,
          directus_files_id: fileId,
          sort: sort++,
        })
      } catch (err) {
        console.warn(`  Warning gallery ${slug}: ${err.message}`)
      }
    }
    console.log(`  Migrated gallery for ${slug || projectId} (${gallery.length} item(s))`)
  }
}

async function reseedGalleriesFromContent(projects) {
  const content = await loadContentFiles()
  for (const row of projects) {
    const existing = await api(
      `/items/projects_gallery?filter[projects_id][_eq]=${row.id}&limit=1`,
      'GET',
    )
    if (existing.data?.length) continue
    const source = content.projects.find((p) => p.slug === row.slug)
    if (!source?.gallery?.length) continue
    await seedProjectRelations(row.id, { gallery: source.gallery, sections: [] })
    console.log(`  Reseeded gallery for ${row.slug}`)
  }
}

/** Convert projects.sections JSON → project_sections O2M rows. */
async function migrateProjectSectionsToO2M() {
  console.log('Migrating projects.sections → project_sections (O2M)…')
  const status = await ensureProjectSectionsCollection()
  const field = await getField('projects', 'sections')
  const projects = (await api('/items/projects?limit=-1', 'GET')).data ?? []

  const pending = []
  if (field?.type === 'json' || status.needsJsonMigration) {
    for (const row of projects) {
      const sections = Array.isArray(row.sections) ? row.sections : []
      pending.push({ projectId: row.id, slug: row.slug, sections })
    }
  }

  // If still JSON, drop it then create O2M alias
  if (field?.type === 'json') {
    await removeField('projects', 'sections')
    await ensureProjectSectionsCollection()
  }

  if (!pending.length) {
    await reseedSectionsFromContent(projects)
    return
  }

  for (const { projectId, slug, sections } of pending) {
    // Skip if O2M rows already exist
    const existing = await api(
      `/items/project_sections?filter[project][_eq]=${projectId}&limit=1`,
      'GET',
    )
    if (existing.data?.length) continue

    for (const [i, section] of sections.entries()) {
      try {
        let imageId = null
        const raw = section.image
        if (raw && isUuid(raw)) imageId = raw
        else if (raw && (isMediaPath(raw) || String(raw).startsWith('/'))) {
          imageId = await ensurePathUploaded(raw, uploadCache)
        }
        await api('/items/project_sections', 'POST', {
          project: projectId,
          sort: i + 1,
          section_id: section.id ?? section.section_id ?? '',
          title: section.title ?? '',
          image: imageId,
          image_alt: section.image_alt ?? section.imageAlt ?? '',
          quote: section.quote ?? '',
          paragraphs: section.paragraphs ?? [],
        })
      } catch (err) {
        console.warn(`  Warning section ${slug}/${section.id}: ${err.message}`)
      }
    }
    console.log(`  Migrated sections for ${slug || projectId} (${sections.length} item(s))`)
  }
}

async function reseedSectionsFromContent(projects) {
  const content = await loadContentFiles()
  for (const row of projects) {
    const existing = await api(
      `/items/project_sections?filter[project][_eq]=${row.id}&limit=1`,
      'GET',
    )
    if (existing.data?.length) continue
    const source = content.projects.find((p) => p.slug === row.slug)
    if (!source?.sections?.length) continue
    await seedProjectRelations(row.id, { gallery: [], sections: source.sections })
    console.log(`  Reseeded sections for ${row.slug}`)
  }
}

async function migrateEmbeddedMediaPaths() {
  console.log('Converting remaining path strings on top-level media fields…')

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

  const projects = (await api('/items/projects?limit=-1', 'GET')).data ?? []
  for (const row of projects) {
    if (typeof row.image === 'string' && isMediaPath(row.image)) {
      try {
        const fileId = await ensurePathUploaded(row.image, uploadCache)
        await api(`/items/projects/${row.id}`, 'PATCH', { image: fileId })
        console.log(`  Updated project ${row.slug} cover image`)
      } catch (err) {
        console.warn(`  Warning project ${row.slug} image: ${err.message}`)
      }
    }
  }
}

function isEmptyFileValue(value) {
  if (value == null || value === '') return true
  if (typeof value === 'string' && isMediaPath(value)) return true
  return false
}

async function reseedEmptyMediaFromContent() {
  console.log('Reseeding empty media fields from content/*.json …')
  const content = await loadContentFiles()

  try {
    const hero = (await api('/items/hero', 'GET')).data
    if (hero && isEmptyFileValue(hero.image) && content.hero?.image) {
      const patch = await rewriteMediaFieldsToFileIds({ image: content.hero.image }, uploadCache)
      await api('/items/hero', 'PATCH', { image: patch.image })
      console.log(`  hero.image ← ${patch.image}`)
    }
  } catch (err) {
    console.warn(`  Warning reseeding hero: ${err.message}`)
  }

  try {
    const about = (await api('/items/about', 'GET')).data
    if (about && isEmptyFileValue(about.portrait) && content.about?.portrait) {
      const patch = await rewriteMediaFieldsToFileIds({ portrait: content.about.portrait }, uploadCache)
      await api('/items/about', 'PATCH', { portrait: patch.portrait })
      console.log(`  about.portrait ← ${patch.portrait}`)
    }
  } catch (err) {
    console.warn(`  Warning reseeding about: ${err.message}`)
  }

  try {
    const tracks = (await api('/items/sketch_tracks?limit=-1', 'GET')).data ?? []
    for (const row of tracks) {
      const source = content.sketches.tracks.find((t) => t.id === row.track_id)
      if (!source?.audio || !isEmptyFileValue(row.audio)) continue
      try {
        const patch = await rewriteMediaFieldsToFileIds({ audio: source.audio }, uploadCache)
        await api(`/items/sketch_tracks/${row.id}`, 'PATCH', { audio: patch.audio })
        console.log(`  sketch_tracks.${row.track_id}.audio ← ${patch.audio}`)
      } catch (err) {
        console.warn(`  Warning reseeding sketch ${row.track_id}: ${err.message}`)
      }
    }
  } catch (err) {
    console.warn(`  Warning listing sketch_tracks: ${err.message}`)
  }

  try {
    const projects = (await api('/items/projects?limit=-1', 'GET')).data ?? []
    for (const row of projects) {
      const source = content.projects.find((p) => p.slug === row.slug)
      if (!source) continue
      if (isEmptyFileValue(row.image) && source.image) {
        try {
          const fileId = await ensurePathUploaded(source.image, uploadCache)
          await api(`/items/projects/${row.id}`, 'PATCH', { image: fileId })
          console.log(`  projects.${row.slug}.image ← ${fileId}`)
        } catch (err) {
          console.warn(`  Warning reseeding project image ${row.slug}: ${err.message}`)
        }
      }
    }
  } catch (err) {
    console.warn(`  Warning listing projects: ${err.message}`)
  }
}

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
  await grantPublicRead('directus_files')
}

console.log('CMS migrate starting…')
await ensureSchema()
await migrateStringFileFields()
await repairAllFileFields()
await assertFileRelations(FILE_RELATION_FIELDS)
await migrateFromLegacyGlobals()
await migrateLegacyProjects()
await seedFromContentFiles()
await migrateEmbeddedMediaPaths()
await migrateProjectGalleryToFiles()
await migrateProjectSectionsToO2M()
await repairFileField('project_sections', {
  field: 'image',
  type: 'uuid',
  meta: {
    interface: 'file-image',
    special: ['file'],
    width: 'half',
    options: { folder: null, enableCreate: true, enableSelect: true },
  },
  schema: { is_nullable: true },
}).catch((err) => console.warn(`project_sections.image repair: ${err.message}`))
await assertFileRelations([
  ...FILE_RELATION_FIELDS,
  { collection: 'project_sections', field: 'image' },
])
await reseedEmptyMediaFromContent()
await normalizeSiteUrl()
await cleanupLegacySchema()
await ensurePermissions()
console.log('CMS migrate done.')
console.log(
  'Next: hard-refresh Directus admin — file fields should show Upload + Library. Then redeploy the site app.',
)
