import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ContentStore, HttpError, isValidFileKey, sanitizeFilename } from './contentStore.mjs'

let tmp
let store

beforeEach(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'store-'))
  await mkdir(path.join(tmp, 'content', 'projects'), { recursive: true })
  await mkdir(path.join(tmp, 'media'), { recursive: true })
  store = new ContentStore({
    contentDir: path.join(tmp, 'content'),
    mediaDir: path.join(tmp, 'media'),
    maxUploadBytes: 5 * 1024 * 1024,
    maxDimension: 1920,
    quality: 80,
  })
})

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true })
})

describe('isValidFileKey', () => {
  it('accepts globals and project slugs only', () => {
    expect(isValidFileKey('site')).toBe(true)
    expect(isValidFileKey('projects/my-project')).toBe(true)
    expect(isValidFileKey('../etc/passwd')).toBe(false)
    expect(isValidFileKey('projects/../site')).toBe(false)
    expect(isValidFileKey('package.json')).toBe(false)
  })
})

describe('sanitizeFilename', () => {
  it('makes safe slugs', () => {
    expect(sanitizeFilename('My Photo (final).PNG')).toBe('my-photo-final')
    expect(sanitizeFilename('../../evil.sh')).toBe('evil')
    expect(sanitizeFilename('')).toBe('file')
  })
})

describe('content files', () => {
  it('writes and reads back content', async () => {
    await store.writeFile('site', { name: 'Test' })
    const { files } = await store.readAll()
    expect(files.site).toEqual({ name: 'Test' })
    const raw = JSON.parse(await readFile(path.join(tmp, 'content', 'site.json'), 'utf8'))
    expect(raw).toEqual({ name: 'Test' })
  })

  it('rejects invalid keys', async () => {
    await expect(store.writeFile('../../tmp/evil', {})).rejects.toBeInstanceOf(HttpError)
  })

  it('creates and deletes projects', async () => {
    const key = await store.createProject('my-game')
    expect(key).toBe('projects/my-game')
    let { files } = await store.readAll()
    expect(files['projects/my-game'].slug).toBe('my-game')
    await expect(store.createProject('my-game')).rejects.toMatchObject({ status: 409 })
    await store.deleteProject('my-game')
    ;({ files } = await store.readAll())
    expect(files['projects/my-game']).toBeUndefined()
  })
})

describe('media', () => {
  it('converts image uploads to webp', async () => {
    const png = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#336699' } })
      .png()
      .toBuffer()
    const publicPath = await store.saveUpload({ name: 'Cover Photo.png', dataBase64: png.toString('base64') })
    expect(publicPath).toBe('/media/cover-photo.webp')
    const written = await readFile(path.join(tmp, 'media', 'cover-photo.webp'))
    const meta = await sharp(written).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(40)
  })

  it('downscales large images', async () => {
    const big = await sharp({ create: { width: 4000, height: 1000, channels: 3, background: '#111111' } })
      .jpeg()
      .toBuffer()
    const publicPath = await store.saveUpload({ name: 'big.jpg', dataBase64: big.toString('base64') })
    const meta = await sharp(path.join(tmp, 'media', path.basename(publicPath))).metadata()
    expect(meta.width).toBe(1920)
  })

  it('passes audio through unchanged', async () => {
    const bytes = Buffer.from('fake-mp3-bytes')
    const publicPath = await store.saveUpload({ name: 'Track 01.mp3', dataBase64: bytes.toString('base64') })
    expect(publicPath).toBe('/media/track-01.mp3')
    const written = await readFile(path.join(tmp, 'media', 'track-01.mp3'))
    expect(written.equals(bytes)).toBe(true)
  })

  it('rejects unsupported types and oversized files', async () => {
    await expect(store.saveUpload({ name: 'x.exe', dataBase64: Buffer.from('x').toString('base64') })).rejects.toMatchObject({ status: 415 })
    const huge = Buffer.alloc(6 * 1024 * 1024, 1)
    await expect(store.saveUpload({ name: 'x.mp3', dataBase64: huge.toString('base64') })).rejects.toMatchObject({ status: 413 })
  })

  it('never overwrites an existing file', async () => {
    const bytes = Buffer.from('audio')
    const first = await store.saveUpload({ name: 'a.mp3', dataBase64: bytes.toString('base64') })
    const second = await store.saveUpload({ name: 'a.mp3', dataBase64: bytes.toString('base64') })
    expect(first).toBe('/media/a.mp3')
    expect(second).toBe('/media/a-2.mp3')
  })

  it('lists and deletes media, blocking traversal', async () => {
    await writeFile(path.join(tmp, 'media', 'x.mp3'), 'x')
    expect((await store.listMedia()).map((m) => m.path)).toEqual(['/media/x.mp3'])
    await expect(store.deleteMedia('/media/../site.json')).rejects.toMatchObject({ status: 400 })
    await expect(store.deleteMedia('/other/x.mp3')).rejects.toMatchObject({ status: 400 })
    await store.deleteMedia('/media/x.mp3')
    expect(await store.listMedia()).toEqual([])
  })
})
