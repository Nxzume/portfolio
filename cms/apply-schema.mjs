/**
 * Creates this portfolio site's Directus schema:
 *  - portfolio_globals (singleton): one JSON field per content/*.json file
 *    (site, hero, about, contact, focuses, sketches, score,
 *    projects_section) — kept as opaque JSON rather than granular fields
 *    since each section's shape is already defined and validated by
 *    src/content/normalize.ts on the site side.
 *  - projects (collection): slug + a JSON payload field, one row per
 *    content/projects/*.json file.
 *
 * Usage: DIRECTUS_URL=... DIRECTUS_TOKEN=... node cms/apply-schema.mjs
 */
const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://localhost:8055').replace(/\/+$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN
if (!TOKEN) throw new Error('DIRECTUS_TOKEN is required')

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

async function createCollection(def) {
  console.log(`Creating collection: ${def.collection}`)
  await api('/collections', 'POST', def)
}

const jsonField = (field) => ({ field, type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } })

await createCollection({
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

await createCollection({
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

console.log('Schema created.')
