/**
 * Idempotent CMS migration — safe to run on every deploy.
 *
 * - Creates missing collections/fields
 * - Seeds from content/*.json when Directus is empty
 * - Grants public read where missing
 *
 * Usage:
 *   DIRECTUS_URL=https://portfolio-cms.vancouverly.ca DIRECTUS_TOKEN=... node cms/migrate.mjs
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, ensureCollection, ensureField, grantPublicRead, requireConfig, verifyToken } from './lib/directus.mjs'

requireConfig()
await verifyToken()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../content')

const jsonField = (field) => ({
  field,
  type: 'json',
  meta: { interface: 'input-code', options: { language: 'json' } },
})

async function ensureSchema() {
  await ensureCollection({
    collection: 'portfolio_globals',
    meta: { singleton: true, icon: 'article' },
    schema: {},
    fields: [
      {
        field: 'id',
        type: 'integer',
        meta: { hidden: true, interface: 'input' },
        schema: { is_primary_key: true, has_auto_increment: true },
      },
      jsonField('site'),
      jsonField('hero'),
      jsonField('about'),
      jsonField('contact'),
      jsonField('focuses'),
      jsonField('sketches'),
      jsonField('score'),
      jsonField('projects_section'),
    ],
  })

  const globalFields = ['site', 'hero', 'about', 'contact', 'focuses', 'sketches', 'score', 'projects_section']
  for (const field of globalFields) {
    await ensureField('portfolio_globals', jsonField(field))
  }

  await ensureCollection({
    collection: 'projects',
    meta: { icon: 'work', sort_field: 'sort' },
    schema: {},
    fields: [
      {
        field: 'id',
        type: 'integer',
        meta: { hidden: true, interface: 'input' },
        schema: { is_primary_key: true, has_auto_increment: true },
      },
      { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } },
      { field: 'slug', type: 'string', meta: { interface: 'input', note: 'URL slug, e.g. "arena"' } },
      {
        field: 'payload',
        type: 'json',
        meta: {
          interface: 'input-code',
          options: { language: 'json' },
          note: 'The full project object (title, summary, body, images, etc.)',
        },
      },
    ],
  })

  for (const fieldDef of [
    { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } },
    { field: 'slug', type: 'string', meta: { interface: 'input', note: 'URL slug, e.g. "arena"' } },
    {
      field: 'payload',
      type: 'json',
      meta: {
        interface: 'input-code',
        options: { language: 'json' },
        note: 'The full project object (title, summary, body, images, etc.)',
      },
    },
  ]) {
    await ensureField('projects', fieldDef)
  }
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(CONTENT_DIR, relativePath), 'utf8'))
}

async function seedIfEmpty() {
  let globals = null
  try {
    const res = await api('/items/portfolio_globals', 'GET')
    globals = res.data
  } catch {
    globals = null
  }

  const { data: projects } = await api('/items/projects?limit=1', 'GET')
  const hasGlobals = globals?.site && Object.keys(globals.site).length > 0
  const hasProjects = projects?.length > 0

  if (hasGlobals && hasProjects) {
    console.log('Content already seeded — skipping')
    return
  }

  console.log('Seeding from content/*.json …')

  const seedGlobals = {
    site: await readJson('site.json'),
    hero: await readJson('hero.json'),
    about: await readJson('about.json'),
    contact: await readJson('contact.json'),
    focuses: await readJson('focuses.json'),
    sketches: await readJson('sketches.json'),
    score: await readJson('score.json'),
    projects_section: await readJson('projects-section.json'),
  }
  await api('/items/portfolio_globals', 'PATCH', seedGlobals)
  console.log('Seeded portfolio_globals')

  if (!hasProjects) {
    const projectsDir = path.join(CONTENT_DIR, 'projects')
    const files = (await readdir(projectsDir)).filter((f) => f.endsWith('.json'))
    let i = 0
    for (const file of files) {
      const payload = await readJson(path.join('projects', file))
      const slug = String(payload.slug ?? file.replace(/\.json$/, ''))
      await api('/items/projects', 'POST', { slug, payload, sort: ++i })
    }
    console.log(`Seeded ${files.length} project(s)`)
  }

  console.log('Seed complete')
}

async function ensurePermissions() {
  for (const collection of ['portfolio_globals', 'projects']) {
    await grantPublicRead(collection)
  }
}

console.log('CMS migrate starting…')
await ensureSchema()
await seedIfEmpty()
await ensurePermissions()
console.log('CMS migrate done.')
