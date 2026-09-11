/**
 * Append-only changelog for content edits. Every save/delete/revert through
 * the admin API records the file's previous contents (or null when the file
 * is new), so any entry can be reverted to restore the state before it.
 *
 * Stored as JSONL under content/_history/ so it rides along with the normal
 * content publish to GitHub and survives restarts.
 */
import { appendFile, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { HttpError, isValidFileKey } from './contentStore.mjs'

export const HISTORY_DIR = '_history'
const HISTORY_FILE = 'changelog.jsonl'
const MAX_ENTRIES = 500

export class Changelog {
  constructor({ contentDir }) {
    this.contentDir = path.resolve(contentDir)
    this.file = path.join(this.contentDir, HISTORY_DIR, HISTORY_FILE)
  }

  /** Append an entry. previous is the JSON value before the change, or null. */
  async record({ key, action, previous }) {
    if (!isValidFileKey(key)) throw new HttpError(400, `Unknown content file: ${key}`)
    if (!['save', 'delete', 'revert'].includes(action)) throw new HttpError(400, `Unknown action: ${action}`)
    const entry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      key,
      action,
      previous: previous === undefined ? null : previous,
    }
    await mkdir(path.dirname(this.file), { recursive: true })
    await appendFile(this.file, `${JSON.stringify(entry)}\n`, 'utf8')
    return entry
  }

  /** Newest first. */
  async list(limit = 100) {
    const entries = await this.#readAll()
    return entries.slice(-Math.max(1, Math.min(limit, MAX_ENTRIES))).reverse()
  }

  async get(id) {
    const entries = await this.#readAll()
    return entries.find((entry) => entry.id === id) || null
  }

  async #readAll() {
    let raw
    try {
      raw = await readFile(this.file, 'utf8')
    } catch {
      return []
    }
    const entries = []
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const entry = JSON.parse(trimmed)
        if (entry && typeof entry.id === 'string' && typeof entry.key === 'string') entries.push(entry)
      } catch {
        // Skip corrupt lines instead of failing the whole log.
      }
    }
    return entries
  }

  /** Keep the log bounded so the published repo does not grow without limit. */
  async prune(keep = MAX_ENTRIES) {
    let info
    try {
      info = await stat(this.file)
    } catch {
      return
    }
    if (!info.isFile()) return
    const entries = await this.#readAll()
    if (entries.length <= keep) return
    const trimmed = entries.slice(-keep)
    const tmp = `${this.file}.tmp-${process.pid}`
    await mkdir(path.dirname(this.file), { recursive: true })
    await writeFile(tmp, `${trimmed.map((entry) => JSON.stringify(entry)).join('\n')}\n`, 'utf8')
    await rename(tmp, this.file)
  }
}
