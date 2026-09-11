import { useCallback, useEffect, useState } from 'react'
import { api, type ChangelogEntry } from './api'

const ACTION_LABEL: Record<ChangelogEntry['action'], string> = {
  save: 'Edited',
  delete: 'Deleted',
  revert: 'Reverted',
}

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChangelogPanel({ onReverted }: { onReverted: (key: string) => void }) {
  const [entries, setEntries] = useState<ChangelogEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await api.changelog()
      setEntries(data.entries)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load changelog')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function revert(entry: ChangelogEntry) {
    const label = `${ACTION_LABEL[entry.action]} ${entry.key} (${formatTime(entry.at)})`
    if (!window.confirm(`Revert this change?\n\n${label}\n\nThe file goes back to how it was right before this edit.`)) {
      return
    }
    setBusyId(entry.id)
    setError(null)
    try {
      const { key } = await api.revert(entry.id)
      await load()
      onReverted(key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revert failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="changelog">
      <div className="changelog__head">
        <h2>Changelog</h2>
        <button type="button" className="btn btn--small" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      <p className="editor__hint">
        Every save through this portal is recorded. Reverting restores the file to how it was right before that
        change, then publishes like a normal edit.
      </p>
      {error ? <p className="notice notice--error">{error}</p> : null}
      {entries === null ? (
        <p className="editor__hint">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="editor__hint">No changes recorded yet. Edits you save from now on will appear here.</p>
      ) : (
        <ul className="changelog__list">
          {entries.map((entry) => (
            <li key={entry.id} className="changelog__item">
              <div className="changelog__meta">
                <span className={`changelog__action changelog__action--${entry.action}`}>
                  {ACTION_LABEL[entry.action]}
                </span>
                <strong>{entry.key}</strong>
                <span className="changelog__time">{formatTime(entry.at)}</span>
              </div>
              <button
                type="button"
                className="btn btn--small btn--danger"
                disabled={busyId !== null}
                onClick={() => void revert(entry)}
              >
                {busyId === entry.id ? 'Reverting…' : 'Revert'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
