import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Changelog } from './changelog.mjs'
import { HttpError } from './contentStore.mjs'

let tmp
let log

beforeEach(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'changelog-'))
  await mkdir(path.join(tmp, 'content'), { recursive: true })
  log = new Changelog({ contentDir: path.join(tmp, 'content') })
})

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true })
})

describe('Changelog', () => {
  it('records entries newest first', async () => {
    await log.record({ key: 'site', action: 'save', previous: { name: 'Old' } })
    await log.record({ key: 'hero', action: 'save', previous: null })
    const entries = await log.list()
    expect(entries).toHaveLength(2)
    expect(entries[0].key).toBe('hero')
    expect(entries[1].key).toBe('site')
    expect(entries[1].previous).toEqual({ name: 'Old' })
    expect(entries[0].previous).toBeNull()
  })

  it('persists entries to JSONL on disk', async () => {
    const entry = await log.record({ key: 'site', action: 'save', previous: { a: 1 } })
    const raw = await readFile(path.join(tmp, 'content', '_history', 'changelog.jsonl'), 'utf8')
    const parsed = JSON.parse(raw.trim())
    expect(parsed.id).toBe(entry.id)
    expect(parsed.action).toBe('save')
  })

  it('fetches entries by id', async () => {
    const entry = await log.record({ key: 'about', action: 'delete', previous: { lead: 'x' } })
    expect(await log.get(entry.id)).toMatchObject({ key: 'about', action: 'delete' })
    expect(await log.get('missing')).toBeNull()
  })

  it('rejects unknown keys and actions', async () => {
    await expect(log.record({ key: '../evil', action: 'save', previous: null })).rejects.toBeInstanceOf(HttpError)
    await expect(log.record({ key: 'site', action: 'nuke', previous: null })).rejects.toBeInstanceOf(HttpError)
  })

  it('skips corrupt lines instead of failing', async () => {
    await mkdir(path.dirname(log.file), { recursive: true })
    await writeFile(log.file, 'not json\n{"id":"ok","key":"site","action":"save","previous":null}\n', 'utf8')
    const entries = await log.list()
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('ok')
  })

  it('prunes to the newest entries', async () => {
    for (let i = 0; i < 10; i += 1) {
      await log.record({ key: 'site', action: 'save', previous: { i } })
    }
    await log.prune(4)
    const entries = await log.list(100)
    expect(entries).toHaveLength(4)
    expect(entries[entries.length - 1].previous).toEqual({ i: 6 })
  })

  it('returns an empty list when no log exists', async () => {
    expect(await log.list()).toEqual([])
  })
})
