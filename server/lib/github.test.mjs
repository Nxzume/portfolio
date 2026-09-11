import { describe, expect, it } from 'vitest'
import { buildTreeEntries, collectContentFiles, gitBlobSha, isManagedPath, planChanges } from './github.mjs'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

describe('gitBlobSha', () => {
  it('matches git hash-object output', () => {
    // `printf 'hello\n' | git hash-object --stdin` -> ce01362…
    expect(gitBlobSha(Buffer.from('hello\n'))).toBe('ce013625030ba8dba906f756967f9e9ca394464a')
  })

  it('is stable for binary content', () => {
    const bytes = Buffer.from([0, 1, 2, 255, 254])
    expect(gitBlobSha(bytes)).toBe(gitBlobSha(Buffer.from([0, 1, 2, 255, 254])))
  })
})

describe('isManagedPath', () => {
  it('allows content and all public asset dirs', () => {
    expect(isManagedPath('content/site.json')).toBe(true)
    expect(isManagedPath('public/media/hero.webp')).toBe(true)
    expect(isManagedPath('public/images/hero.png')).toBe(true)
    expect(isManagedPath('public/audio/track.mp3')).toBe(true)
    expect(isManagedPath('src/App.tsx')).toBe(false)
    expect(isManagedPath('package.json')).toBe(false)
    expect(isManagedPath('public/favicon.svg')).toBe(false)
  })
})

describe('planChanges', () => {
  it('uploads new and changed files, deletes vanished ones, skips identical ones', () => {
    const same = Buffer.from('same')
    const changedLocal = Buffer.from('v2')
    const local = new Map([
      ['content/site.json', same],
      ['content/hero.json', changedLocal],
      ['public/media/new.webp', Buffer.from('new')],
    ])
    const remote = [
      { path: 'content/site.json', sha: gitBlobSha(same) },
      { path: 'content/hero.json', sha: gitBlobSha(Buffer.from('v1')) },
      { path: 'public/media/old.webp', sha: gitBlobSha(Buffer.from('old')) },
    ]

    const { uploads, deletions } = planChanges(local, remote)
    expect(uploads.map((u) => u.path).sort()).toEqual(['content/hero.json', 'public/media/new.webp'])
    expect(deletions).toEqual(['public/media/old.webp'])
  })

  it('reports nothing when local matches remote', () => {
    const bytes = Buffer.from('{}')
    const local = new Map([['content/site.json', bytes]])
    const remote = [{ path: 'content/site.json', sha: gitBlobSha(bytes) }]
    const { uploads, deletions } = planChanges(local, remote)
    expect(uploads).toEqual([])
    expect(deletions).toEqual([])
  })
})

describe('buildTreeEntries', () => {
  it('gives deletions a mode and type with a null sha (GitHub rejects modeless entries)', () => {
    const entries = buildTreeEntries(
      [{ path: 'content/site.json', sha: 'abc123' }],
      ['public/media/old.webp'],
    )
    expect(entries).toEqual([
      { path: 'content/site.json', mode: '100644', type: 'blob', sha: 'abc123' },
      { path: 'public/media/old.webp', mode: '100644', type: 'blob', sha: null },
    ])
  })
})

describe('collectContentFiles', () => {
  it('walks content and all asset dirs into repo-relative paths', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'collect-'))
    try {
      const contentDir = path.join(tmp, 'content')
      const publicDir = path.join(tmp, 'public')
      await mkdir(path.join(contentDir, 'projects'), { recursive: true })
      await mkdir(path.join(publicDir, 'media'), { recursive: true })
      await mkdir(path.join(publicDir, 'images'), { recursive: true })
      await mkdir(path.join(publicDir, 'audio'), { recursive: true })
      await writeFile(path.join(contentDir, 'site.json'), '{}')
      await writeFile(path.join(contentDir, 'projects', 'arena.json'), '{}')
      await writeFile(path.join(publicDir, 'media', 'hero.webp'), 'img')
      await writeFile(path.join(publicDir, 'images', 'cover.png'), 'img')
      await writeFile(path.join(publicDir, 'audio', 'track.mp3'), 'audio')

      const files = await collectContentFiles({ contentDir, publicDir })
      expect([...files.keys()].sort()).toEqual([
        'content/projects/arena.json',
        'content/site.json',
        'public/audio/track.mp3',
        'public/images/cover.png',
        'public/media/hero.webp',
      ])
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  })

  it('tolerates missing directories', async () => {
    const files = await collectContentFiles({
      contentDir: path.join(os.tmpdir(), 'nope-content'),
      publicDir: path.join(os.tmpdir(), 'nope-public'),
    })
    expect(files.size).toBe(0)
  })
})
