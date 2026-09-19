import { useEffect, useState, type ReactNode } from 'react'
import { move } from './list'

/** Shared form building blocks for the admin editors. */

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      className="input"
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <textarea
      className="input"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function NumberInput({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (value: number | undefined) => void
}) {
  return (
    <input
      className="input input--number"
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value
        const parsed = Number(raw)
        onChange(raw.trim() === '' || !Number.isFinite(parsed) ? undefined : parsed)
      }}
    />
  )
}

export function ListRow({
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
  children: ReactNode
}) {
  return (
    <div className="listrow">
      <div className="listrow__body">{children}</div>
      <div className="listrow__actions">
        <button type="button" className="iconbtn" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
          ↑
        </button>
        <button
          type="button"
          className="iconbtn"
          aria-label="Move down"
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          ↓
        </button>
        <button type="button" className="iconbtn iconbtn--danger" aria-label="Remove" onClick={() => onRemove(index)}>
          ✕
        </button>
      </div>
    </div>
  )
}

export function StringList({
  items,
  onChange,
  addLabel = 'Add item',
  multiline = false,
  placeholder,
}: {
  items: string[]
  onChange: (items: string[]) => void
  addLabel?: string
  multiline?: boolean
  placeholder?: string
}) {
  return (
    <div className="stringlist">
      {items.map((item, i) => (
        <ListRow
          key={i}
          index={i}
          count={items.length}
          onMove={(from, to) => onChange(move(items, from, to))}
          onRemove={(at) => onChange(items.filter((_, j) => j !== at))}
        >
          {multiline ? (
            <TextArea
              value={item}
              rows={3}
              onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
              placeholder={placeholder}
            />
          ) : (
            <TextInput
              value={item}
              onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
              placeholder={placeholder}
            />
          )}
        </ListRow>
      ))}
      <button type="button" className="btn btn--small" onClick={() => onChange([...items, ''])}>
        + {addLabel}
      </button>
    </div>
  )
}

export function KeyValueList({
  value,
  onChange,
  keyLabel = 'Name',
  valueLabel = 'URL',
}: {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  keyLabel?: string
  valueLabel?: string
}) {
  const entries = Object.entries(value)
  const update = (i: number, key: string, val: string) => {
    const next = entries.map(([k, v], j) => (j === i ? ([key, v] as [string, string]) : ([k, v] as [string, string])))
    next[i] = [key, val]
    onChange(Object.fromEntries(next))
  }
  return (
    <div className="stringlist">
      {entries.map(([key, val], i) => (
        <ListRow
          key={i}
          index={i}
          count={entries.length}
          onMove={(from, to) => onChange(Object.fromEntries(move(entries, from, to)))}
          onRemove={(at) => onChange(Object.fromEntries(entries.filter((_, j) => j !== at)))}
        >
          <div className="listrow__pair">
            <input
              className="input"
              type="text"
              value={key}
              placeholder={keyLabel}
              onChange={(e) => update(i, e.target.value, val)}
            />
            <input
              className="input"
              type="text"
              value={val}
              placeholder={valueLabel}
              onChange={(e) => update(i, key, e.target.value)}
            />
          </div>
        </ListRow>
      ))}
      <button
        type="button"
        className="btn btn--small"
        onClick={() => onChange({ ...value, [`key-${entries.length + 1}`]: '' })}
      >
        + Add link
      </button>
    </div>
  )
}

export function AssetPicker({
  value,
  onChange,
  kind,
  onOpenLibrary,
}: {
  value: string
  onChange: (value: string) => void
  kind: 'image' | 'audio'
  onOpenLibrary: () => void
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [value])

  return (
    <div className="assetpicker">
      {kind === 'image' ? (
        value && !failed ? (
          <a href={value} target="_blank" rel="noreferrer" className="assetpicker__thumb-link">
            <img className="assetpicker__preview" src={value} alt="" onError={() => setFailed(true)} />
          </a>
        ) : value ? (
          <div className="assetpicker__missing" role="alert">
            <strong>Image not found on the server.</strong>
            <span>{value}</span>
            <span>Upload it via the media library, or pick a different file.</span>
          </div>
        ) : (
          <div className="assetpicker__empty">No image selected</div>
        )
      ) : value ? (
        <audio className="assetpicker__audio" src={value} controls preload="none" />
      ) : (
        <div className="assetpicker__empty">No audio selected</div>
      )}
      <div className="assetpicker__controls">
        <input
          className="input"
          type="text"
          value={value}
          placeholder={`/media/…`}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="btn btn--small" onClick={onOpenLibrary}>
          Media library
        </button>
      </div>
    </div>
  )
}