import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
import { projects, site } from './content'
import { metaForPath, renderMetaHtml } from './lib/meta'

/** Every path written as a static HTML file at build time. */
export function routes(): string[] {
  return ['/', ...projects.map((project) => `/projects/${project.slug}`), '/404']
}

/** Indexable pages only — the 404 is excluded. */
export function sitemapRoutes(): string[] {
  return routes().filter((route) => route !== '/404')
}

export const siteOrigin = site.url

export function render(url: string) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )

  return { html, head: renderMetaHtml(metaForPath(url)) }
}
