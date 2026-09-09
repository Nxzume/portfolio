/**
 * Directus file upload / path helpers for CMS media (images + audio).
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, requireConfig } from './directus.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(__dirname, '../..')
export const PUBLIC_DIR = path.join(REPO_ROOT, 'public')
export const MEDIA_PUBLIC_DIR = path.join(PUBLIC_DIR, 'media')
export const MEDIA_PUBLIC_PREFIX = '/media'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const SITE_URL = (process.env.SITE_URL || 'https://alexandreguichet.vancouverly.ca').replace(/\/+$/, '')

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value.trim())
}

/** Normalize a Directus file field value to a UUID string (or ''). */
export function extractFileId(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (isUuid(trimmed)) return trimmed
    return ''
  }
  if (typeof value === 'object') {
    if (typeof value.id === 'string' && isUuid(value.id)) return value.id
  }
  return ''
}

/** True when the value looks like a site-relative media path. */
export function isMediaPath(value) {
  return typeof value === 'string' && /^\/(images|audio|media)\//.test(value.trim())
}

export function basenameFromPath(mediaPath) {
  return path.posix.basename(mediaPath.trim())
}

async function fileExists(absPath) {
  try {
    await access(absPath)
    return true
  } catch {
    return false
  }
}

/**
 * Load bytes for a path like /images/foo.png — from local public/ first,
 * then from the live site (so Coolify migrate can seed after binaries leave git).
 */
export async function loadMediaBytes(mediaPath) {
  const rel = mediaPath.trim().replace(/^\//, '')
  const localPath = path.join(PUBLIC_DIR, rel)
  if (await fileExists(localPath)) {
    const buffer = await readFile(localPath)
    return { buffer, filename: path.basename(localPath), source: `local:${localPath}` }
  }

  const url = `${SITE_URL}/${rel}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Could not load media ${mediaPath} from local disk or ${url} (${res.status})`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  return { buffer, filename: path.basename(rel), source: url }
}

function mimeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase()
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
  }
  return map[ext] || 'application/octet-stream'
}

/** Find an existing Directus file by download filename (idempotent uploads). */
export async function findFileByFilename(filename) {
  const q = new URLSearchParams({
    'filter[filename_download][_eq]': filename,
    limit: '1',
    fields: 'id,filename_download,type,title',
  })
  const res = await api(`/files?${q}`, 'GET')
  return res.data?.[0] ?? null
}

/** Upload a Buffer to Directus Files. Returns file UUID. */
export async function uploadBuffer(buffer, filename, { title } = {}) {
  const { url, token } = requireConfig()
  const form = new FormData()
  const bytes = buffer instanceof Buffer ? buffer : Buffer.from(buffer)
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeFromFilename(filename) })
  form.append('file', blob, filename)
  const meta = { title: title || filename }
  form.append('data', JSON.stringify(meta))

  const res = await fetch(`${url}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Upload ${filename} failed: ${res.status} ${JSON.stringify(json)}`)
  }
  const id = json.data?.id
  if (!id) throw new Error(`Upload ${filename} returned no id`)
  return id
}

/**
 * Ensure a site path exists as a Directus file. Returns UUID.
 * Caches path → id in the provided Map.
 */
export async function ensurePathUploaded(mediaPath, cache = new Map()) {
  const key = mediaPath.trim()
  if (cache.has(key)) return cache.get(key)
  if (isUuid(key)) {
    cache.set(key, key)
    return key
  }
  if (!isMediaPath(key)) {
    throw new Error(`Not a media path: ${key}`)
  }

  const filename = basenameFromPath(key)
  const existing = await findFileByFilename(filename)
  if (existing?.id) {
    cache.set(key, existing.id)
    console.log(`  Reusing Directus file ${filename} → ${existing.id}`)
    return existing.id
  }

  const { buffer, source } = await loadMediaBytes(key)
  const id = await uploadBuffer(buffer, filename, { title: filename })
  cache.set(key, id)
  console.log(`  Uploaded ${filename} from ${source} → ${id}`)
  return id
}

/** Rewrite any media path string in a value tree to a Directus file UUID. */
export async function rewritePathsToFileIds(value, cache = new Map()) {
  if (typeof value === 'string') {
    if (isMediaPath(value)) return ensurePathUploaded(value, cache)
    return value
  }
  if (Array.isArray(value)) {
    const out = []
    for (const item of value) out.push(await rewritePathsToFileIds(item, cache))
    return out
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = await rewritePathsToFileIds(v, cache)
    }
    return out
  }
  return value
}

function sanitizeFilename(name) {
  return String(name || 'file')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 180)
}

/**
 * Download a Directus asset into public/media/ and return the site-relative path.
 * `ref` may be a UUID string, an expanded file object, or a legacy /images|/audio path.
 */
export async function materializeFileToPublic(ref, { directusUrl, usedNames = new Set() } = {}) {
  if (typeof ref === 'string' && isMediaPath(ref)) {
    const rel = ref.trim().replace(/^\//, '')
    const abs = path.join(PUBLIC_DIR, rel)
    if (!(await fileExists(abs))) {
      try {
        const { buffer } = await loadMediaBytes(ref.trim())
        await mkdir(path.dirname(abs), { recursive: true })
        await writeFile(abs, buffer)
        console.log(`  Bootstrapped ${ref.trim()} (${buffer.length} bytes)`)
      } catch (err) {
        console.warn(`  Warning: could not bootstrap ${ref}: ${err.message}`)
      }
    }
    return ref.trim()
  }

  const id = extractFileId(ref)
  if (!id) {
    if (typeof ref === 'string' && ref.startsWith('/')) return ref.trim()
    return ''
  }

  let filename =
    typeof ref === 'object' && ref.filename_download
      ? sanitizeFilename(ref.filename_download)
      : `${id}.bin`

  if (!filename.includes('.')) filename = `${filename}.bin`

  let destName = filename
  if (usedNames.has(destName.toLowerCase())) {
    destName = `${id.slice(0, 8)}-${filename}`
  }
  usedNames.add(destName.toLowerCase())

  await mkdir(MEDIA_PUBLIC_DIR, { recursive: true })
  const abs = path.join(MEDIA_PUBLIC_DIR, destName)

  if (!(await fileExists(abs))) {
    const assetUrl = `${directusUrl.replace(/\/+$/, '')}/assets/${id}`
    const res = await fetch(assetUrl, { headers: { Accept: '*/*' } })
    if (!res.ok) {
      throw new Error(`Failed to download asset ${id}: ${res.status} ${res.statusText}`)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    await writeFile(abs, buffer)
    console.log(`  Saved /media/${destName} (${buffer.length} bytes)`)
  }

  return `${MEDIA_PUBLIC_PREFIX}/${destName}`
}

/** Walk a JSON tree and replace file UUIDs / expanded files with /media/ paths. */
export async function rewriteFileIdsToPublicPaths(value, opts) {
  if (typeof value === 'string') {
    if (isUuid(value)) return materializeFileToPublic(value, opts)
    return value
  }
  if (Array.isArray(value)) {
    const out = []
    for (const item of value) out.push(await rewriteFileIdsToPublicPaths(item, opts))
    return out
  }
  if (value && typeof value === 'object') {
    // Expanded Directus file object used as a field value
    if (typeof value.id === 'string' && isUuid(value.id) && value.filename_download) {
      return materializeFileToPublic(value, opts)
    }
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = await rewriteFileIdsToPublicPaths(v, opts)
    }
    return out
  }
  return value
}

/** Keys that hold media references in content / Directus rows. */
export const MEDIA_VALUE_KEYS = new Set(['image', 'portrait', 'audio'])

/**
 * Narrow rewrite: only known media keys (avoids treating random UUID strings
 * elsewhere as files). Still recurses into arrays/objects.
 */
export async function rewriteMediaFieldsToFileIds(value, cache = new Map()) {
  if (Array.isArray(value)) {
    const out = []
    for (const item of value) out.push(await rewriteMediaFieldsToFileIds(item, cache))
    return out
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (MEDIA_VALUE_KEYS.has(k) && typeof v === 'string' && isMediaPath(v)) {
        out[k] = await ensurePathUploaded(v, cache)
      } else if (MEDIA_VALUE_KEYS.has(k) && typeof v === 'string' && isUuid(v)) {
        out[k] = v
      } else {
        out[k] = await rewriteMediaFieldsToFileIds(v, cache)
      }
    }
    return out
  }
  return value
}

export async function rewriteMediaFieldsToPublicPaths(value, opts) {
  if (Array.isArray(value)) {
    const out = []
    for (const item of value) out.push(await rewriteMediaFieldsToPublicPaths(item, opts))
    return out
  }
  if (value && typeof value === 'object') {
    if (typeof value.id === 'string' && isUuid(value.id) && (value.filename_download || value.type)) {
      // Whole value is an expanded file — only when caller passed it as leaf
      return materializeFileToPublic(value, opts)
    }
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (MEDIA_VALUE_KEYS.has(k)) {
        out[k] = await materializeFileToPublic(v, opts)
      } else {
        out[k] = await rewriteMediaFieldsToPublicPaths(v, opts)
      }
    }
    return out
  }
  return value
}
