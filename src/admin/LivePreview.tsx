import { useMemo } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { PreviewModeProvider } from '../components/PreviewMode'
import { ContentProvider } from '../content/context'
import { buildContent } from '../content/load'
import { HomePage } from '../pages/HomePage'
import { ProjectPage } from '../pages/ProjectPage'
import { rawFromFiles } from './previewContent'

/**
 * Renders the real site pages from the editor's in-memory drafts — typing in
 * a field updates the preview immediately, no save required.
 *
 * Uses MemoryRouter so project pages can read useParams. Safe because the
 * admin app is mounted outside the site BrowserRouter (see main.tsx).
 */
export function LivePreview({
  files,
  drafts,
  selection,
}: {
  files: Record<string, unknown>
  drafts: Record<string, unknown>
  selection: string
}) {
  const content = useMemo(() => buildContent(rawFromFiles({ ...files, ...drafts })), [files, drafts])
  const slug = selection.startsWith('projects/') ? selection.slice('projects/'.length) : null
  const path = slug ? `/projects/${slug}` : '/'

  return (
    <div className="livepreview">
      <ContentProvider value={content}>
        <PreviewModeProvider>
          <MemoryRouter initialEntries={[path]} key={path}>
            {slug ? <ProjectPage /> : <HomePage />}
          </MemoryRouter>
        </PreviewModeProvider>
      </ContentProvider>
    </div>
  )
}
