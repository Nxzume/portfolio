/**
 * Grants the Public policy read access to portfolio_globals and projects,
 * so the build-time fetch (and, if used, any runtime preview) can read
 * published content without authentication.
 *
 * Usage: DIRECTUS_URL=... DIRECTUS_TOKEN=... node cms/grant-public-read.mjs
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

const policiesRes = await api('/policies?filter[name][_eq]=$t:public_label', 'GET')
const publicPolicy = policiesRes.data[0]
if (!publicPolicy) throw new Error('Could not find the Public policy — check this Directus instance manually')

for (const collection of ['portfolio_globals', 'projects']) {
  await api('/permissions', 'POST', {
    collection,
    action: 'read',
    policy: publicPolicy.id,
    fields: ['*'],
    permissions: {},
    validation: {},
  })
  console.log(`Granted public read: ${collection}`)
}

console.log('Done.')
