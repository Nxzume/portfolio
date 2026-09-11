import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
import { ContentProvider } from './content/context'
import type { Content } from './content/load'
import { metaForPath, renderMetaHtml } from './lib/meta'

/** Every path written as a static HTML file at build time. */
export function routes(content: Content): string[] {
  return ['/', ...content.projects.map((project) => `/projects/${project.slug}`), '/404']
}

/** Indexable pages only — the 404 is excluded. */
export function sitemapRoutes(content: Content): string[] {
  return routes(content).filter((route) => route !== '/404')
}

export function render(url: string, content: Content) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <ContentProvider value={content}>
          <App />
        </ContentProvider>
      </StaticRouter>
    </StrictMode>,
  )

  return { html, head: renderMetaHtml(metaForPath(content, url), content.site) }
}

export { loadContentFromDir } from './content/node'
