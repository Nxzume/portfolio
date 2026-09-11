/**
 * Reads and writes the content files the site is built from, and stores
 * uploaded media. Images are re-encoded to WebP (max 1920px by default) so
 * originals never leave the admin's machine.
 */
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const GLOBAL_KEYS = [
  'site',
  'hero',
  'about',
  'contact',
  'score',
  'projects-section',
  'focuses',
  'sketches',
]

const PROJECT_KEY = /^projects\/[a-z0-9][a-z0-9-]{0,80}$/
const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/

const IMAGE_TYPES = new Map([
  ['.png', 'image'],
  ['.jpg', 'image'],
  ['.jpeg', 'image'],
  ['.webp', 'image'],
  ['.gif', 'image'],
  ['.avif', 'image'],
  ['.svg', 'svg'],
])
const AUDIO_TYPES = new Map([
  ['.mp3', 'audio'],
  ['.ogg', 'audio'],
  ['.wav', 'audio'],
  ['.m4a', 'audio'],
  ['.flac', 'audio'],
])

export function isValidFileKey(key) {
  return GLOBAL_KEYS.includes(key) || PROJECT_KEY.test(key)
}

export function isValidSlug(slug) {
  return SLUG.test(slug)
}

export function sanitizeFilename(name) {
  const base = path
    .basename(String(name || ''))
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'file'
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export class ContentStore {
  constructor({ contentDir, mediaDir, publicDir, maxUploadBytes, maxDimension, quality }) {
    this.contentDir = path.resolve(contentDir)
    this.mediaDir = path.resolve(mediaDir)
    this.publicDir = path.resolve(publicDir || path.dirname(this.mediaDir))
    this.maxUploadBytes = maxUploadBytes
    this.maxDimension = maxDimension
    this.quality = quality
  }

  filePath(key) {
    return path.join(this.contentDir, `${key}.json`)
  }

  async readAll() {
    const files = {}
    for (const key of GLOBAL_KEYS) {
      files[key] = await this.readJson(this.filePath(key))
    }
    let projectFiles = []
    try {
      projectFiles = (await readdir(path.join(this.contentDir, 'projects'))).filter(
        (name) => name.endsWith('.json') && !name.startsWith('_'),
      )
    } catch {
      projectFiles = []
    }
    for (const name of projectFiles.sort()) {
      files[`projects/${name.replace(/\.json$/, '')}`] = await this.readJson(
        path.join(this.contentDir, 'projects', name),
      )
    }
    return { files, media: await this.listMedia() }
  }

  async readJson(file) {
    try {
      return JSON.parse(await readFile(file, 'utf8'))
    } catch {
      return {}
    }
  }

  async writeFile(key, data) {
    if (!isValidFileKey(key)) throw new HttpError(400, `Unknown content file: ${key}`)
    if (data === null || typeof data === 'undefined') throw new HttpError(400, 'Body must be JSON')
    const file = this.filePath(key)
    await mkdir(path.dirname(file), { recursive: true })
    const tmp = `${file}.tmp-${process.pid}`
    await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    await rename(tmp, file)
    return key
  }

  async createProject(slug) {
    if (!isValidSlug(slug)) throw new HttpError(400, 'Invalid slug — use lowercase letters, numbers, dashes.')
    const key = `projects/${slug}`
    const file = this.filePath(key)
    try {
      await stat(file)
      throw new HttpError(409, `Project "${slug}" already exists`)
    } catch (err) {
      if (err instanceof HttpError) throw err
    }
    let template
    try {
      template = JSON.parse(
        await readFile(path.join(this.contentDir, 'projects', '_templates', 'project.json'), 'utf8'),
      )
    } catch {
      template = null
    }
    const data = {
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      subtitle: '',
      image: '',
      gallery: [],
      summary: '',
      highlights: [],
      links: [],
      intro: [],
      sections: [],
      ...(template && typeof template === 'object' ? template : {}),
      slug,
    }
    await this.writeFile(key, data)
    return key
  }

  async deleteProject(slug) {
    const key = `projects/${slug}`
    if (!PROJECT_KEY.test(key)) throw new HttpError(400, 'Only projects can be deleted here')
    await rm(this.filePath(key), { force: true })
  }

  async listMedia() {
    const out = []
    const walk = async (dir, prefix) => {
      let entries
      try {
        entries = await readdir(dir, { withFileTypes: true })
      } catch {
        return
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) await walk(full, `${prefix}${entry.name}/`)
        else if (entry.isFile() && !entry.name.startsWith('.')) {
          const info = await stat(full)
          out.push({ path: `${prefix}${entry.name}`, size: info.size, modified: info.mtime.toISOString() })
        }
      }
    }

    // Uploaded files live in public/media; the original site assets live in
    // public/images and public/audio. Show all of them in the library.
    await walk(this.mediaDir, '/media/')
    await walk(path.join(this.publicDir, 'images'), '/images/')
    await walk(path.join(this.publicDir, 'audio'), '/audio/')

    return out.sort((a, b) => b.modified.localeCompare(a.modified))
  }

  async uniqueMediaPath(base, ext) {
    let candidate = `${base}${ext}`
    let n = 2
    while (true) {
      try {
        await stat(path.join(this.mediaDir, candidate))
        candidate = `${base}-${n}${ext}`
        n += 1
      } catch {
        return candidate
      }
    }
  }

  /** Accepts a base64 upload, processes it, stores it, returns its public /media path. */
  async saveUpload({ name, dataBase64 }) {
    const bytes = Buffer.from(dataBase64 || '', 'base64')
    if (!bytes.length) throw new HttpError(400, 'Empty upload')
    if (bytes.length > this.maxUploadBytes) {
      throw new HttpError(413, `File too large (max ${Math.round(this.maxUploadBytes / 1024 / 1024)} MB)`)
    }

    const ext = path.extname(String(name || '')).toLowerCase()
    const kind = IMAGE_TYPES.get(ext) || AUDIO_TYPES.get(ext)
    if (!kind) throw new HttpError(415, `Unsupported file type "${ext || '?'}" — images (png, jpg, webp, gif, avif, svg) or audio (mp3, ogg, wav, m4a, flac).`)

    const base = sanitizeFilename(name)
    await mkdir(this.mediaDir, { recursive: true })

    if (kind === 'image') {
      const rel = await this.uniqueMediaPath(base, '.webp')
      await sharp(bytes, { animated: true })
        .resize({
          width: this.maxDimension,
          height: this.maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: this.quality })
        .toFile(path.join(this.mediaDir, rel))
      return `/media/${rel}`
    }

    const rel = await this.uniqueMediaPath(base, ext)
    await writeFile(path.join(this.mediaDir, rel), bytes)
    return `/media/${rel}`
  }

  async deleteMedia(publicPath) {
    const prefixes = { '/media/': this.mediaDir, '/images/': path.join(this.publicDir, 'images'), '/audio/': path.join(this.publicDir, 'audio') }
    const prefix = Object.keys(prefixes).find((p) => typeof publicPath === 'string' && publicPath.startsWith(p))
    if (!prefix) {
      throw new HttpError(400, 'Path must start with /media/, /images/, or /audio/')
    }
    const rel = publicPath.slice(prefix.length)
    const base = prefixes[prefix]
    const full = path.resolve(base, rel)
    if (rel.includes('..') || !full.startsWith(`${base}${path.sep}`)) {
      throw new HttpError(400, 'Invalid path')
    }
    await rm(full, { force: true })
  }
}
