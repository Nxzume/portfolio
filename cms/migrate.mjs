/**
 * Idempotent CMS migration — safe to run on every deploy.
 *
 * - Creates missing collections/fields
 * - Seeds portfolio_globals/projects from content/*.json if empty
 * - Grants public read where missing
 *
 * Usage:
 *   DIRECTUS_URL=https://portfolio-cms.vancouverly.ca DIRECTUS_TOKEN=... node cms/migrate.mjs
 *
 * See docs/coolify-deployment.md for the "migrate app" pattern (a
 * non-public Coolify app that runs this on your server, avoiding
 * Cloudflare blocking GitHub Actions' IPs) and the GitHub Actions
 * workflows in .github/workflows/.
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { api, ensureCollection, grantPublicRead, requireConfig, verifyToken } from './lib/directus.mjs'

requireConfig()
await verifyToken()

const CONTENT_DIR = path.resolve('content')
const jsonField = (field) => ({ field, type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } })

async function ensureSchema() {
  await ensureCollection({
    collection: 'portfolio_globals',
    meta: { singleton: true, icon: 'article' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
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

  await ensureCollection({
    collection: 'projects',
    meta: { icon: 'work', sort_field: 'sort' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } },
      { field: 'slug', type: 'string', meta: { interface: 'input', note: 'URL slug, e.g. "arena"' } },
      { field: 'payload', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, note: 'The full project object (title, summary, body, images, etc.)' } },
    ],
  })
}

async function readJson(file) {
  return JSON.parse(await readFile(path.join(CONTENT_DIR, file), 'utf8'))
}

async function seedIfEmpty() {
  const { data: projects } = await api('/items/projects?limit=1', 'GET')
  if (projects?.length > 0) {
    console.log('projects already seeded — skipping seed')
    return
  }

  console.log('Seeding from content/*.json…')

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
