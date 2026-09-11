import { useMemo } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PreviewModeProvider } from '../components/PreviewMode'
import { ContentProvider } from '../content/context'
import { buildContent } from '../content/load'
import { HomePage } from '../pages/HomePage'
import { ProjectPage } from '../pages/ProjectPage'
import { rawFromFiles } from './previewContent'

/** Maps a click in the preview to the content file that owns that section. */
export function editKeyFor(target: Element, currentSlug: string | null): string | null {
  const card = target.closest('.projects__card')
  if (card) {
    const href = card.getAttribute('href') || ''
    const match = href.match(/\/projects\/([a-z0-9-]+)/)
    if (match) return `projects/${match[1]}`
  }
  if (target.closest('.hero')) return 'hero'
  if (target.closest('.focus')) return 'focuses'
  if (target.closest('.score__item')) return 'sketches'
  if (target.closest('.score')) return 'score'
  if (target.closest('.projects')) return 'projects-section'
  if (target.closest('.about')) return 'about'
  if (target.closest('.contact')) return 'contact'
  if (target.closest('.footer')) return 'site'
  if (target.closest('.nav')) return 'site'
  if (target.closest('.project-page')) return currentSlug ? `projects/${currentSlug}` : null
  return null
}

/**
 * Renders the real site pages from the editor's in-memory drafts — typing in
 * a field updates the preview immediately, no save required. Clicking a
 * section jumps the editor to the file that owns it.
 *
 * Uses MemoryRouter so project pages can read useParams. Safe because the
 * admin app is mounted outside the site BrowserRouter (see main.tsx).
 */
export function LivePreview({
  files,
  drafts,
  selection,
  onSelect,
}: {
  files: Record<string, unknown>
  drafts: Record<string, unknown>
  selection: string
  onSelect?: (key: string) => void
}) {
  const content = useMemo(() => buildContent(rawFromFiles({ ...files, ...drafts })), [files, drafts])
  const slug = selection.startsWith('projects/') ? selection.slice('projects/'.length) : null
  const path = slug ? `/projects/${slug}` : '/'

  const handleClick = (e: React.MouseEvent) => {
    if (!onSelect || !(e.target instanceof Element)) return
    const key = editKeyFor(e.target, slug)
    if (key) {
      // Keep the preview router from following links on its own — the
      // selection change re-routes the preview instead.
      e.preventDefault()
      e.stopPropagation()
      onSelect(key)
    }
  }

  return (
    <div className="livepreview" onClickCapture={handleClick}>
      <ContentProvider value={content}>
        <PreviewModeProvider>
          {/* ProjectPage reads the slug from useParams, so it must render
              through a matching Route — otherwise it falls back to the 404. */}
          <MemoryRouter initialEntries={[path]} key={path}>
            <Routes>
              <Route path="/projects/:slug" element={<ProjectPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        </PreviewModeProvider>
      </ContentProvider>
    </div>
  )
}
