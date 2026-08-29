#!/usr/bin/env node
/**
 * Push content/*.json from this repo into a Vancouverly CMS (portfolio profile).
 *
 * Usage:
 *   CMS_URL=https://portfolio.vancouverly.ca CMS_ADMIN_TOKEN=<jwt> node scripts/seed-cms.mjs
 *
 * Get a JWT by signing in at accounts.vancouverly.ca, or:
 *   curl -s -X POST https://portfolio.vancouverly.ca/api/auth/login \
 *     -H 'Content-Type: application/json' \
 *     -d '{"email":"...","password":"..."}'
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contentRoot = path.resolve(__dirname, '../content')

const cmsUrl = (process.env.CMS_URL ?? 'http://localhost:8787').replace(/\/$/, '')
const token = process.env.CMS_ADMIN_TOKEN?.trim()

if (!token) {
  console.error('Set CMS_ADMIN_TOKEN (admin JWT from accounts / CMS login).')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

async function request(method, apiPath, body) {
  const res = await fetch(`${cmsUrl}${apiPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`${method} ${apiPath} → ${res.status}: ${text}`)
  }
  return json
}

function readJson(name) {
  const file = path.join(contentRoot, name)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function readProjects() {
  const dir = path.join(contentRoot, 'projects')
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .map((name) => {
      const payload = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
      const slug = String(payload.slug ?? name.replace(/\.json$/, ''))
      return { slug, payload }
    })
}

async function upsertProject(slug, payload) {
  const data = { slug, payload }
  try {
    await request('POST', '/api/admin/collections/projects', { data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!message.includes('409')) throw err
    await request('PUT', `/api/admin/collections/projects/${slug}`, { data })
  }
  await request('POST', '/api/admin/publish', {
    target: { collection: 'projects', slug },
  })
}

async function main() {
  const globals = {
    site: readJson('site.json'),
    hero: readJson('hero.json'),
    about: readJson('about.json'),
    contact: readJson('contact.json'),
    focuses: readJson('focuses.json'),
    sketches: readJson('sketches.json'),
    score: readJson('score.json'),
    projectsSection: readJson('projects-section.json'),
  }

  console.log(`Seeding ${cmsUrl} from ${contentRoot}`)
  await request('PUT', '/api/admin/globals', { data: globals })
  await request('POST', '/api/admin/publish', { target: 'globals' })

  for (const project of readProjects()) {
    console.log(`  project: ${project.slug}`)
    await upsertProject(project.slug, project.payload)
  }

  console.log('Done — published globals and projects.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
