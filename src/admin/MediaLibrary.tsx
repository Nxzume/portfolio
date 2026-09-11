import { useRef, useState } from 'react'
import { api, type MediaItem } from './api'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isAudio(path: string) {
  return /\.(mp3|ogg|wav|m4a|flac)$/i.test(path)
}

export function MediaLibrary({
  items,
  onChanged,
  onSelect,
  onClose,
  filter,
}: {
  items: MediaItem[]
  onChanged: () => void
  onSelect?: (path: string) => void
  onClose?: () => void
  filter?: 'image' | 'audio'
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const visible = items.filter((item) => (filter ? (filter === 'audio' ? isAudio(item.path) : !isAudio(item.path)) : true))

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
          reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
          reader.readAsDataURL(file)
        })
        await api.uploadMedia(file.name, data)
      }
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove(path: string) {
    if (!window.confirm(`Delete ${path}? This is published to the repo on the next save.`)) return
    setError(null)
    try {
      await api.deleteMedia(path)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="medialib">
      <div className="medialib__bar">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={filter === 'audio' ? 'audio/*' : filter === 'image' ? 'image/*' : 'image/*,audio/*'}
          onChange={(e) => void upload(e.target.files)}
          disabled={busy}
        />
        {busy ? <span className="medialib__busy">Uploading…</span> : null}
        {onClose ? (
          <button type="button" className="btn btn--small" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>
      <p className="editor__hint">
        Images are converted to WebP and resized to at most 1920px on upload — originals never touch the server.
      </p>
      {error ? <p className="notice notice--error">{error}</p> : null}
      {visible.length === 0 ? <p className="editor__hint">Nothing uploaded yet.</p> : null}
      <div className="medialib__grid">
        {visible.map((item) => (
          <figure key={item.path} className="medialib__item">
            {isAudio(item.path) ? (
              <audio src={item.path} controls preload="none" />
            ) : (
              <img src={item.path} alt="" loading="lazy" />
            )}
            <figcaption>
              <span className="medialib__name" title={item.path}>
                {item.path.replace('/media/', '')}
              </span>
              <span className="medialib__size">{formatSize(item.size)}</span>
            </figcaption>
            <div className="medialib__actions">
              {onSelect ? (
                <button type="button" className="btn btn--small" onClick={() => onSelect(item.path)}>
                  Select
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => void navigator.clipboard?.writeText(item.path)}
                >
                  Copy path
                </button>
              )}
              <button type="button" className="btn btn--small btn--danger" onClick={() => void remove(item.path)}>
                Delete
              </button>
            </div>
          </figure>
        ))}
      </div>
    </div>
  )
}
