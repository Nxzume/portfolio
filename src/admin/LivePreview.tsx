import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PreviewModeProvider } from '../components/PreviewMode'
import { ContentProvider } from '../content/context'
import { buildContent } from '../content/load'
import { HomePage } from '../pages/HomePage'
import { ProjectPage } from '../pages/ProjectPage'
import { rawFromFiles } from './previewContent'

/** Maps a click in the preview to the content file that owns that section. */
export function editKeyFor(target: Element, currentSlug: string | null): string | null {
  const projectLink = target.closest('.projects__row, .projects__card')
  if (projectLink) {
    const href = projectLink.getAttribute('href') || ''
    const match = href.match(/\/projects\/([a-z0-9-]+)/)
    if (match) return `projects/${match[1]}`
  }
  if (target.closest('.hero')) return 'hero'
  if (target.closest('.focus')) return 'focuses'
  if (target.closest('.score__item')) return 'sketches'
  if (target.closest('.score__spotify')) return 'score'
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
  const scrollerRef = useRef<HTMLDivElement>(null)

  // Keep the Music / Spotify embed in view while editing those fields.
  useEffect(() => {
    if (selection !== 'score' && selection !== 'sketches') return
    const root = scrollerRef.current
    if (!root) return
    // Wait a frame so draft-driven remounts paint the embed first.
    const id = window.requestAnimationFrame(() => {
      const section = root.querySelector('#compose')
      if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [selection, content.score, content.sketches])

  const handleClick = (e: React.MouseEvent) => {
    if (!onSelect || !(e.target instanceof Element)) return
    // Let visitors play / follow links inside the Spotify iframe; clicks on the
    // iframe element itself never reach here (cross-origin), but guard anyway.
    if (e.target.closest('iframe.score__spotify-frame')) return
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
    <div className="livepreview" ref={scrollerRef} onClickCapture={handleClick}>
      <ContentProvider value={content}>
        <PreviewModeProvider>
          {/* Same motion setup as the public site so ScoreDesk / cards render. */}
          <LazyMotion features={domAnimation} strict>
            <MotionConfig reducedMotion="user">
              {/* ProjectPage reads the slug from useParams, so it must render
                  through a matching Route — otherwise it falls back to the 404. */}
              <MemoryRouter initialEntries={[path]} key={path}>
                <Routes>
                  <Route path="/projects/:slug" element={<ProjectPage />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </MemoryRouter>
            </MotionConfig>
          </LazyMotion>
        </PreviewModeProvider>
      </ContentProvider>
    </div>
  )
}
