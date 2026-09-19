import { asList, galleryItems, num, str, textItems } from '../content/normalize'
import { AssetPicker, Field, KeyValueList, ListRow, NumberInput, StringList, TextArea, TextInput } from './fields'
import { move } from './list'

/**
 * Editors work on the raw JSON of each content file. Known fields get real
 * form controls; anything unknown is preserved untouched on save.
 */

export type EditorProps = {
  value: unknown
  onChange: (next: unknown) => void
  openLibrary: (kind: 'image' | 'audio', onSelect: (path: string) => void) => void
}

type Row = Record<string, unknown>

function asRow(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {}
}

export function SiteEditor({ value, onChange }: EditorProps) {
  const raw = asRow(value)
  const set = (key: string, v: unknown) => onChange({ ...raw, [key]: v })
  const links = asRow(raw.links) as Record<string, string>
  return (
    <div className="editor">
      <Field label="Name"><TextInput value={str(raw.name)} onChange={(v) => set('name', v)} /></Field>
      <Field label="Tagline" hint="Shown under your name and used as the meta description.">
        <TextArea value={str(raw.tagline)} rows={2} onChange={(v) => set('tagline', v)} />
      </Field>
      <Field label="Email"><TextInput value={str(raw.email)} onChange={(v) => set('email', v)} /></Field>
      <Field label="Site URL" hint="Public origin, no trailing slash. Used for canonical links and the sitemap.">
        <TextInput value={str(raw.url)} onChange={(v) => set('url', v)} />
      </Field>
      <Field label="Links" hint="Each name + URL becomes a button in the Contact section. The name is the button label, shown exactly as you type it.">
        <KeyValueList value={links} onChange={(v) => set('links', v)} keyLabel="Button label" valueLabel="https://…" />
      </Field>
    </div>
  )
}

function CtaFields({
  label,
  value,
  onChange,
}: {
  label: string
  value: unknown
  onChange: (v: unknown) => void
}) {
  const raw = asRow(value)
  return (
    <fieldset className="fieldset">
      <legend>{label}</legend>
      <div className="listrow__pair">
        <TextInput value={str(raw.label)} onChange={(v) => onChange({ ...raw, label: v })} placeholder="Label" />
        <TextInput value={str(raw.href)} onChange={(v) => onChange({ ...raw, href: v })} placeholder="#anchor or URL" />
      </div>
    </fieldset>
  )
}

export function HeroEditor({ value, onChange, openLibrary }: EditorProps) {
  const raw = asRow(value)
  const set = (key: string, v: unknown) => onChange({ ...raw, [key]: v })
  return (
    <div className="editor">
      <Field label="Headline"><TextArea value={str(raw.headline)} rows={2} onChange={(v) => set('headline', v)} /></Field>
      <Field label="Background image">
        <AssetPicker kind="image" value={str(raw.image)} onChange={(v) => set('image', v)} onOpenLibrary={() => openLibrary('image', (p) => set('image', p))} />
      </Field>
      <CtaFields label="Primary button" value={raw.primaryCta} onChange={(v) => set('primaryCta', v)} />
      <CtaFields label="Secondary button" value={raw.secondaryCta} onChange={(v) => set('secondaryCta', v)} />
    </div>
  )
}

type TimelineRow = { period: string; role: string; org: string }

function TimelineEditor({ value, onChange }: { value: unknown; onChange: (v: TimelineRow[]) => void }) {
  const items: TimelineRow[] = asList(value).map((item) => {
    const row = asRow(item)
    return { period: str(row.period), role: str(row.role), org: str(row.org) }
  })
  const setItem = (i: number, key: keyof TimelineRow, v: string) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)))
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
          <div className="card">
          <div className="listrow__pair">
            <TextInput value={item.period} onChange={(v) => setItem(i, 'period', v)} placeholder="2023 — now" />
            <TextInput value={item.role} onChange={(v) => setItem(i, 'role', v)} placeholder="Role" />
          </div>
          <TextInput value={item.org} onChange={(v) => setItem(i, 'org', v)} placeholder="Company · Location" />
          </div>
        </ListRow>
      ))}
      <button
        type="button"
        className="btn btn--small"
        onClick={() => onChange([...items, { period: '', role: '', org: '' }])}
      >
        + Add entry
      </button>
    </div>
  )
}

export function AboutEditor({ value, onChange, openLibrary }: EditorProps) {
  const raw = asRow(value)
  const set = (key: string, v: unknown) => onChange({ ...raw, [key]: v })
  return (
    <div className="editor">
      <Field label="Portrait">
        <AssetPicker kind="image" value={str(raw.portrait)} onChange={(v) => set('portrait', v)} onOpenLibrary={() => openLibrary('image', (p) => set('portrait', p))} />
      </Field>
      <Field label="Portrait alt text"><TextInput value={str(raw.portraitAlt)} onChange={(v) => set('portraitAlt', v)} /></Field>
      <Field label="Lead" hint="Big sentence at the top of the about section.">
        <TextArea value={str(raw.lead)} rows={2} onChange={(v) => set('lead', v)} />
      </Field>
      <Field label="Body paragraphs">
        <StringList multiline items={textItems(raw.body)} onChange={(v) => set('body', v)} addLabel="Add paragraph" />
      </Field>
      <Field label="Note" hint="Small line under the body; leave empty to hide.">
        <TextInput value={str(raw.note)} onChange={(v) => set('note', v)} />
      </Field>
      <Field label="Experience timeline" hint="Period, role, and company per row. Leave all rows empty to hide the timeline.">
        <TimelineEditor value={raw.timeline} onChange={(v) => set('timeline', v)} />
      </Field>
    </div>
  )
}

export function SectionCopyEditor({
  value,
  onChange,
  extra,
}: EditorProps & { extra?: 'emailButton' | 'spotify' }) {
  const raw = asRow(value)
  const set = (key: string, v: unknown) => onChange({ ...raw, [key]: v })
  return (
    <div className="editor">
      <Field label="Eyebrow" hint="Small caps line above the title.">
        <TextInput value={str(raw.eyebrow)} onChange={(v) => set('eyebrow', v)} />
      </Field>
      <Field label="Title"><TextInput value={str(raw.title)} onChange={(v) => set('title', v)} /></Field>
      <Field label="Lede"><TextArea value={str(raw.lede)} rows={3} onChange={(v) => set('lede', v)} /></Field>
      {extra === 'emailButton' ? (
        <Field label="Email button label" hint="Defaults to “Email {first name}” when empty.">
          <TextInput value={str(raw.emailButtonText)} onChange={(v) => set('emailButtonText', v)} />
        </Field>
      ) : null}
      {extra === 'spotify' ? (
        <Field
          label="Spotify links"
          hint="One album, playlist, track, or artist URL per row. An artist link shows Popular tracks. When any link is set, uploaded tracks are hidden."
        >
          <StringList
            items={
              asList(raw.spotifyUrls).length
                ? asList(raw.spotifyUrls).map((item) =>
                    typeof item === 'string' ? item : str(asRow(item).url || asRow(item).href),
                  )
                : str(raw.spotifyUrl) || str(raw.spotifyPlaylist)
                  ? [str(raw.spotifyUrl) || str(raw.spotifyPlaylist)]
                  : ['']
            }
            onChange={(items) => {
              const { spotifyUrl: _u, spotifyPlaylist: _p, spotifyMoreHref: _m, ...rest } = raw
              onChange({
                ...rest,
                spotifyUrls: items.map((s) => s.trim()).filter(Boolean),
              })
            }}
            addLabel="+ Add Spotify link"
          />
        </Field>
      ) : null}
    </div>
  )
}

/**
 * focuses.json and sketches.json wrap their lists ({ "tabs": [...] } /
 * { "tracks": [...] }). Read the wrapped list and write back in the same
 * shape so the file format never changes under the editor.
 */
function useWrappedList(value: unknown, key: string, onChange: (next: unknown) => void) {
  const raw = asRow(value)
  const wrapped = !Array.isArray(value) && Array.isArray(raw[key])
  const items = (Array.isArray(value) ? value : asList(raw[key])).map(asRow)
  const update = (next: Row[]) => onChange(wrapped ? { ...raw, [key]: next } : next)
  return { items, update }
}

export function FocusesEditor({ value, onChange }: EditorProps) {
  const { items, update } = useWrappedList(value, 'tabs', onChange)
  const setItem = (i: number, key: string, v: unknown) => update(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)))
  return (
    <div className="editor">
      <p className="editor__hint">Tabs on the homepage (Compose / Levels / Azure…). The id is derived from the label.</p>
      {items.map((item, i) => (
        <ListRow
          key={i}
          index={i}
          count={items.length}
          onMove={(from, to) => update(move(items, from, to))}
          onRemove={(at) => update(items.filter((_, j) => j !== at))}
        >
          <div className="card">
            <Field label="Label"><TextInput value={str(item.label)} onChange={(v) => setItem(i, 'label', v)} /></Field>
            <Field label="Headline"><TextInput value={str(item.headline)} onChange={(v) => setItem(i, 'headline', v)} /></Field>
            <Field label="Body"><TextArea value={str(item.body)} rows={3} onChange={(v) => setItem(i, 'body', v)} /></Field>
          </div>
        </ListRow>
      ))}
      <button type="button" className="btn btn--small" onClick={() => update([...items, { label: '', headline: '', body: '' }])}>
        + Add tab
      </button>
    </div>
  )
}

export function SketchesEditor({ value, onChange, openLibrary }: EditorProps) {
  const { items, update } = useWrappedList(value, 'tracks', onChange)
  const setItem = (i: number, key: string, v: unknown) => update(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)))
  return (
    <div className="editor">
      <p className="editor__hint">
        Uploaded tracks for the score desk. Hidden on the site while a Spotify link is set under Score section.
        With an audio file visitors hear the recording; without one the site synthesizes a placeholder from BPM /
        base frequency / pattern.
      </p>
      {items.map((item, i) => (
        <ListRow
          key={i}
          index={i}
          count={items.length}
          onMove={(from, to) => update(move(items, from, to))}
          onRemove={(at) => update(items.filter((_, j) => j !== at))}
        >
          <div className="card">
            <div className="listrow__pair">
              <Field label="Title"><TextInput value={str(item.title)} onChange={(v) => setItem(i, 'title', v)} /></Field>
              <Field label="Mood" hint="Optional line under the title.">
                <TextInput value={str(item.mood)} onChange={(v) => setItem(i, 'mood', v)} />
              </Field>
            </div>
            <Field label="Audio file">
              <AssetPicker
                kind="audio"
                value={str(item.audio)}
                onChange={(v) => setItem(i, 'audio', v)}
                onOpenLibrary={() => openLibrary('audio', (p) => setItem(i, 'audio', p))}
              />
            </Field>
            <div className="listrow__pair">
              <Field label="BPM"><NumberInput value={num(item.bpm)} onChange={(v) => setItem(i, 'bpm', v)} /></Field>
              <Field label="Base frequency"><NumberInput value={num(item.baseFreq)} onChange={(v) => setItem(i, 'baseFreq', v)} /></Field>
            </div>
            <Field label="Pattern" hint="Comma-separated semitone steps, e.g. 0, 3, 7, 12.">
              <TextInput
                value={asList(item.pattern).map((x) => num(x) ?? '').join(', ')}
                onChange={(v) =>
                  setItem(
                    i,
                    'pattern',
                    v.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)),
                  )
                }
              />
            </Field>
          </div>
        </ListRow>
      ))}
      <button type="button" className="btn btn--small" onClick={() => update([...items, { title: '', mood: '' }])}>
        + Add track
      </button>
    </div>
  )
}

type LinkRow = { label: string; href: string }

function LinksEditor({ value, onChange }: { value: unknown; onChange: (v: LinkRow[]) => void }) {
  const items: LinkRow[] = asList(value).map((item) => {
    const row = asRow(item)
    return { label: str(row.label), href: str(row.href) }
  })
  const setItem = (i: number, key: keyof LinkRow, v: string) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)))
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
          <div className="listrow__pair">
            <TextInput value={item.label} onChange={(v) => setItem(i, 'label', v)} placeholder="Label" />
            <TextInput value={item.href} onChange={(v) => setItem(i, 'href', v)} placeholder="https://…" />
          </div>
        </ListRow>
      ))}
      <button type="button" className="btn btn--small" onClick={() => onChange([...items, { label: '', href: '' }])}>
        + Add link
      </button>
    </div>
  )
}

function GalleryEditor({
  value,
  onChange,
  openLibrary,
}: {
  value: unknown
  onChange: (v: string[]) => void
  openLibrary: EditorProps['openLibrary']
}) {
  const items = galleryItems(value)
  return (
    <div className="stringlist">
      {items.map((src, i) => (
        <ListRow
          key={i}
          index={i}
          count={items.length}
          onMove={(from, to) => onChange(move(items, from, to))}
          onRemove={(at) => onChange(items.filter((_, j) => j !== at))}
        >
          <AssetPicker
            kind="image"
            value={src}
            onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
            onOpenLibrary={() => openLibrary('image', (p) => onChange(items.map((x, j) => (j === i ? p : x))))}
          />
        </ListRow>
      ))}
      <button type="button" className="btn btn--small" onClick={() => onChange([...items, ''])}>
        + Add image
      </button>
    </div>
  )
}

function SectionsEditor({
  value,
  onChange,
  openLibrary,
}: {
  value: unknown
  onChange: (v: Row[]) => void
  openLibrary: EditorProps['openLibrary']
}) {
  const items = asList(value).map(asRow)
  const update = (next: Row[]) => onChange(next)
  const setItem = (i: number, key: string, v: unknown) => update(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)))
  return (
    <div className="stringlist">
      {items.map((item, i) => (
        <ListRow
          key={i}
          index={i}
          count={items.length}
          onMove={(from, to) => update(move(items, from, to))}
          onRemove={(at) => update(items.filter((_, j) => j !== at))}
        >
          <div className="card">
            <Field label="Section title"><TextInput value={str(item.title)} onChange={(v) => setItem(i, 'title', v)} /></Field>
            <Field label="Paragraphs">
              <StringList multiline items={textItems(item.paragraphs)} onChange={(v) => setItem(i, 'paragraphs', v)} addLabel="Add paragraph" />
            </Field>
            <Field label="Pull quote" hint="Optional.">
              <TextArea value={str(item.quote)} rows={2} onChange={(v) => setItem(i, 'quote', v)} />
            </Field>
            <Field label="Image">
              <AssetPicker
                kind="image"
                value={str(item.image)}
                onChange={(v) => setItem(i, 'image', v)}
                onOpenLibrary={() => openLibrary('image', (p) => setItem(i, 'image', p))}
              />
            </Field>
            <Field label="Image alt text"><TextInput value={str(item.imageAlt)} onChange={(v) => setItem(i, 'imageAlt', v)} /></Field>
          </div>
        </ListRow>
      ))}
      <button type="button" className="btn btn--small" onClick={() => update([...items, { title: '', paragraphs: [] }])}>
        + Add section
      </button>
    </div>
  )
}

export function ProjectEditor({ value, onChange, openLibrary }: EditorProps) {
  const raw = asRow(value)
  const set = (key: string, v: unknown) => onChange({ ...raw, [key]: v })
  return (
    <div className="editor">
      <div className="listrow__pair">
        <Field label="Title"><TextInput value={str(raw.title)} onChange={(v) => set('title', v)} /></Field>
        <Field label="Subtitle" hint="Shown above the title, e.g. “Game · 2024”.">
          <TextInput value={str(raw.subtitle)} onChange={(v) => set('subtitle', v)} />
        </Field>
      </div>
      <div className="listrow__pair">
        <Field label="Slug" hint="URL: /projects/<slug>. Rename via the projects list.">
          <TextInput value={str(raw.slug)} onChange={(v) => set('slug', v)} />
        </Field>
        <Field label="Order" hint="Lower sorts first on the homepage.">
          <NumberInput value={num(raw.order)} onChange={(v) => set('order', v)} />
        </Field>
      </div>
      <Field label="Cover image">
        <AssetPicker kind="image" value={str(raw.image)} onChange={(v) => set('image', v)} onOpenLibrary={() => openLibrary('image', (p) => set('image', p))} />
      </Field>
      <Field label="Summary"><TextArea value={str(raw.summary)} rows={2} onChange={(v) => set('summary', v)} /></Field>
      <Field label="Intro paragraphs">
        <StringList multiline items={textItems(raw.intro)} onChange={(v) => set('intro', v)} addLabel="Add paragraph" />
      </Field>
      <Field label="Highlights">
        <StringList items={textItems(raw.highlights)} onChange={(v) => set('highlights', v)} addLabel="Add highlight" />
      </Field>
      <Field label="Links"><LinksEditor value={raw.links} onChange={(v) => set('links', v)} /></Field>
      <Field label="Sections"><SectionsEditor value={raw.sections} onChange={(v) => set('sections', v)} openLibrary={openLibrary} /></Field>
      <Field label="Gallery"><GalleryEditor value={raw.gallery} onChange={(v) => set('gallery', v)} openLibrary={openLibrary} /></Field>
    </div>
  )
}
