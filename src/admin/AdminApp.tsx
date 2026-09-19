import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, api, type AdminStatus, type ContentResponse, type MediaItem } from './api'
import { ChangelogPanel } from './Changelog'
import {
  AboutEditor,
  FocusesEditor,
  HeroEditor,
  ProjectEditor,
  SectionCopyEditor,
  SiteEditor,
  SketchesEditor,
} from './editors'
import { MediaLibrary } from './MediaLibrary'
import { LivePreview } from './LivePreview'
import './admin.css'

function heroImageFrom(files: Record<string, unknown>, drafts: Record<string, unknown>) {
  const draft = drafts['hero']
  const file = files['hero']
  const row =
    draft && typeof draft === 'object' && !Array.isArray(draft)
      ? (draft as Record<string, unknown>)
      : file && typeof file === 'object' && !Array.isArray(file)
        ? (file as Record<string, unknown>)
        : null
  return typeof row?.image === 'string' ? row.image : ''
}

const GLOBAL_FILES = [
  { key: 'site', label: 'Site settings' },
  { key: 'hero', label: 'Hero' },
  { key: 'about', label: 'About' },
  { key: 'contact', label: 'Contact' },
  { key: 'score', label: 'Score section' },
  { key: 'projects-section', label: 'Projects section' },
  { key: 'focuses', label: 'Focus tabs' },
  { key: 'sketches', label: 'Sketch tracks' },
] as const

function projectSlugFromKey(key: string) {
  return key.slice('projects/'.length)
}

function StatusPill({ status, saving }: { status: AdminStatus | null; saving: boolean }) {
  if (saving) return <span className="pill pill--busy">Saving…</span>
  if (!status) return null
  const { publish, render } = status
  if (render.state === 'working') return <span className="pill pill--busy">Rendering…</span>
  if (render.state === 'error') return <span className="pill pill--error">Render failed</span>
  if (publish.state === 'disabled') return <span className="pill">Live · not connected to GitHub</span>
  if (publish.state === 'working' || publish.pending) return <span className="pill pill--busy">Publishing…</span>
  if (publish.state === 'error') return <span className="pill pill--error">Publish failed</span>
  if (publish.last?.sha) return <span className="pill pill--ok">Published {publish.last.sha.slice(0, 7)}</span>
  return <span className="pill">Live</span>
}

function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.login(password)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof ApiError && err.status === 503
        ? 'Admin is disabled on this deployment (no ADMIN_PASSWORD set).'
        : err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={(e) => void submit(e)}>
        <h1>Site admin</h1>
        <p>Sign in to edit content, media, and pages.</p>
        <input
          type="password"
          className="input"
          placeholder="Admin password"
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="notice notice--error">{error}</p> : null}
        <button className="btn btn--primary" type="submit" disabled={busy || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState<'loading' | 'out' | 'in'>('loading')
  const [files, setFiles] = useState<Record<string, unknown>>({})
  const [media, setMedia] = useState<MediaItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, unknown>>({})
  const [selection, setSelection] = useState<string>('site')
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  // Desktop: open. Phone: closed so the editor gets the full width.
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 721px)').matches : true,
  )
  const [library, setLibrary] = useState<{ kind: 'image' | 'audio'; onSelect: (path: string) => void } | null>(null)
  const pollRef = useRef<number | null>(null)

  const dirty = useMemo(() => Object.keys(drafts), [drafts])

  const load = useCallback(async () => {
    const data: ContentResponse = await api.content()
    setFiles(data.files)
    setMedia(data.media)
    setDrafts({})
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await api.status())
    } catch {
      /* status is best-effort */
    }
  }, [])

  useEffect(() => {
    api
      .session()
      .then(() => setSession('in'))
      .catch(() => setSession('out'))
  }, [])

  useEffect(() => {
    if (session !== 'in') return
    load().catch((err) => {
      if (err instanceof ApiError && err.status === 401) setSession('out')
      else setError(err instanceof Error ? err.message : 'Failed to load content')
    })
    void refreshStatus()
  }, [session, load, refreshStatus])

  useEffect(() => () => { if (pollRef.current) window.clearInterval(pollRef.current) }, [])

  function pollUntilIdle() {
    if (pollRef.current) window.clearInterval(pollRef.current)
    const started = Date.now()
    pollRef.current = window.setInterval(() => {
      void (async () => {
        const next = await api.status().catch(() => null)
        if (next) setStatus(next)
        const idle = next && next.render.state !== 'working' && next.publish.state !== 'working' && !next.publish.pending
        if (idle || Date.now() - started > 60_000) {
          if (pollRef.current) window.clearInterval(pollRef.current)
          pollRef.current = null
        }
      })()
    }, 1000)
  }

  function draftOf(key: string) {
    return key in drafts ? drafts[key] : files[key]
  }

  function changeDraft(key: string, next: unknown) {
    setDrafts((prev) => ({ ...prev, [key]: next }))
  }

  function selectSection(key: string) {
    setSelection(key)
    // On phones the sidebar is a drawer — close it after picking a section
    // so the form gets the full width again.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches) {
      setSidebarOpen(false)
    }
  }

  async function saveAll() {
    setSaving(true)
    setError(null)
    try {
      for (const key of dirty) {
        await api.saveFile(key, drafts[key])
      }
      const saved = { ...drafts }
      setFiles((prev) => ({ ...prev, ...saved }))
      setDrafts({})
      pollUntilIdle()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setSession('out')
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function addProject() {
    const slug = window.prompt('Slug for the new project (lowercase, dashes):', 'new-project')
    if (!slug) return
    setError(null)
    try {
      const { file } = await api.createProject(slug)
      await load()
      selectSection(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project')
    }
  }

  async function removeProject(key: string) {
    if (!window.confirm(`Delete ${key}? The page disappears after the next publish.`)) return
    setError(null)
    try {
      await api.deleteFile(key)
      await load()
      selectSection('site')
      pollUntilIdle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete project')
    }
  }

  async function renameProject(key: string) {
    const current = projectSlugFromKey(key)
    const slug = window.prompt('New slug:', current)
    if (!slug || slug === current) return
    const nextKey = `projects/${slug}`
    if (nextKey in files || nextKey in drafts) {
      setError(`A project named "${slug}" already exists`)
      return
    }
    const data = { ...(draftOf(key) as Record<string, unknown>), slug }
    setError(null)
    try {
      await api.saveFile(nextKey, data)
      await api.deleteFile(key)
      await load()
      selectSection(nextKey)
      pollUntilIdle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename project')
    }
  }

  if (session === 'loading') {
    return <div className="admin-login"><p className="editor__hint">Loading…</p></div>
  }
  if (session === 'out') {
    return <Login onLoggedIn={() => setSession('in')} />
  }

  const projectKeys = Object.keys(files)
    .filter((key) => key.startsWith('projects/'))
    .sort()

  const editorProps = {
    value: draftOf(selection),
    onChange: (next: unknown) => changeDraft(selection, next),
    openLibrary: (kind: 'image' | 'audio', onSelect: (path: string) => void) => setLibrary({ kind, onSelect }),
  }

  return (
    <div className="admin">
      <header className="admin__topbar">
        <button
          type="button"
          className="admin__sidebar-toggle"
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <span aria-hidden="true">{sidebarOpen ? '‹' : '›'}</span>
        </button>
        <strong>Site admin</strong>
        <StatusPill status={status} saving={saving} />
        {status?.publish.state === 'error' && status.publish.error ? (
          <span className="pill pill--error" title={status.publish.error}>{status.publish.error}</span>
        ) : null}
        <span className="admin__spacer" />
        <button type="button" className="btn btn--small admin__preview-toggle" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? 'Hide preview' : 'Show preview'}
        </button>
        <a className="btn btn--small" href="/" target="_blank" rel="noreferrer">
          View site
        </a>
        <button
          type="button"
          className="btn btn--primary btn--small"
          disabled={saving || dirty.length === 0}
          onClick={() => void saveAll()}
        >
          {dirty.length > 0 ? `Save & publish (${dirty.length})` : 'Saved'}
        </button>
        <button
          type="button"
          className="btn btn--small"
          onClick={() => {
            void api.logout().then(() => setSession('out'))
          }}
        >
          Log out
        </button>
      </header>

      {error ? <p className="notice notice--error">{error}</p> : null}

      <div
        className={`admin__body ${sidebarOpen ? 'is-sidebar-open' : 'is-sidebar-collapsed'}`}
      >
        {sidebarOpen ? (
          <button
            type="button"
            className="admin__sidebar-backdrop"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
        <nav
          id="admin-sidebar"
          className="admin__sidebar"
          aria-label="Content"
        >
          <p className="admin__group">Site</p>
          {GLOBAL_FILES.slice(0, 4).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`admin__nav ${selection === key ? 'is-active' : ''}`}
              onClick={() => selectSection(key)}
            >
              {label}
              {key in drafts ? <span className="admin__dot" aria-label="unsaved changes" /> : null}
            </button>
          ))}
          <p className="admin__group">Homepage sections</p>
          {GLOBAL_FILES.slice(4).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`admin__nav ${selection === key ? 'is-active' : ''}`}
              onClick={() => selectSection(key)}
            >
              {label}
              {key in drafts ? <span className="admin__dot" aria-label="unsaved changes" /> : null}
            </button>
          ))}
          <p className="admin__group">
            Projects
            <button type="button" className="iconbtn admin__add" aria-label="Add project" onClick={() => void addProject()}>
              +
            </button>
          </p>
          {projectKeys.map((key) => (
            <div key={key} className={`admin__nav admin__nav--project ${selection === key ? 'is-active' : ''}`}>
              <button type="button" className="admin__nav-main" onClick={() => selectSection(key)}>
                {projectSlugFromKey(key)}
                {key in drafts ? <span className="admin__dot" aria-label="unsaved changes" /> : null}
              </button>
              <button type="button" className="iconbtn" aria-label="Rename" title="Rename slug" onClick={() => void renameProject(key)}>
                ✎
              </button>
              <button type="button" className="iconbtn iconbtn--danger" aria-label="Delete" onClick={() => void removeProject(key)}>
                ✕
              </button>
            </div>
          ))}
          <p className="admin__group">Files</p>
          <button
            type="button"
            className={`admin__nav ${selection === 'media' ? 'is-active' : ''}`}
            onClick={() => selectSection('media')}
          >
            Media library
          </button>
          <button
            type="button"
            className={`admin__nav ${selection === 'changelog' ? 'is-active' : ''}`}
            onClick={() => selectSection('changelog')}
          >
            Changelog
          </button>
        </nav>

        <main className="admin__main">
          {selection === 'media' ? (
            <MediaLibrary items={media} onChanged={() => { void load().then(pollUntilIdle) }} />
          ) : selection === 'changelog' ? (
            <ChangelogPanel
              onReverted={(key) => {
                void load().then(pollUntilIdle)
                selectSection(key)
              }}
            />
          ) : selection === 'site' ? (
            <SiteEditor {...editorProps} fallbackShareImage={heroImageFrom(files, drafts)} />
          ) : selection === 'hero' ? (
            <HeroEditor {...editorProps} />
          ) : selection === 'about' ? (
            <AboutEditor {...editorProps} />
          ) : selection === 'contact' ? (
            <SectionCopyEditor {...editorProps} extra="emailButton" />
          ) : selection === 'score' ? (
            <SectionCopyEditor {...editorProps} extra="spotify" />
          ) : selection === 'projects-section' ? (
            <SectionCopyEditor {...editorProps} />
          ) : selection === 'focuses' ? (
            <FocusesEditor {...editorProps} />
          ) : selection === 'sketches' ? (
            <SketchesEditor {...editorProps} />
          ) : selection.startsWith('projects/') ? (
            <ProjectEditor {...editorProps} />
          ) : (
            <p className="editor__hint">Select something to edit.</p>
          )}
        </main>

        {showPreview ? (
          <aside className="admin__preview">
            <p className="admin__preview-label">Live preview — updates as you type; click a section to edit it</p>
            <LivePreview files={files} drafts={drafts} selection={selection} onSelect={selectSection} />
          </aside>
        ) : null}
      </div>

      {library ? (
        <div className="admin__modal" role="dialog" aria-modal="true" aria-label="Media library">
          <div className="admin__modal-card">
            <MediaLibrary
              items={media}
              filter={library.kind}
              onChanged={() => void load()}
              onSelect={(path) => {
                library.onSelect(path)
                setLibrary(null)
              }}
              onClose={() => setLibrary(null)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
