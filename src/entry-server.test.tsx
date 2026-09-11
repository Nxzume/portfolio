import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { content } from './content'
import { ContentProvider } from './content/context'
import { render, routes, sitemapRoutes } from './entry-server'

describe('routes', () => {
  it('covers the homepage, every project, and the 404', () => {
    expect(routes(content)).toEqual([
      '/',
      ...content.projects.map((project) => `/projects/${project.slug}`),
      '/404',
    ])
  })

  it('leaves the 404 out of the sitemap', () => {
    expect(sitemapRoutes(content)).not.toContain('/404')
  })
})

describe('render', () => {
  it('puts the homepage copy in the markup instead of an empty shell', () => {
    const { html, head } = render('/', content)
    expect(html).toContain(content.site.name)
    expect(html).toContain('id="main"')
    expect(head).toContain('<title>')
  })

  it('renders each project page with its own title and canonical url', () => {
    for (const project of content.projects) {
      const { html, head } = render(`/projects/${project.slug}`, content)
      expect(html).toContain(project.title)
      expect(head).toContain(`${content.site.url}/projects/${project.slug}`)
    }
  })

  it('renders the 404 route without falling back to the homepage', () => {
    const { html, head } = render('/404', content)
    expect(head).toContain('content="noindex"')
    expect(html).toContain('That page moved or never existed')
  })

  it('renders whatever content is provided, not the baked bundle content', () => {
    const custom = {
      ...content,
      site: { ...content.site, name: 'Override Name' },
    }
    const { html } = render('/', custom)
    expect(html).toContain('Override Name')
  })
})

describe('hydration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('reuses the prerendered markup without a mismatch', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { html } = render('/', content)
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)

    await act(async () => {
      hydrateRoot(
        container,
        <StrictMode>
          <BrowserRouter>
            <ContentProvider value={content}>
              <App />
            </ContentProvider>
          </BrowserRouter>
        </StrictMode>,
      )
    })

    const complaints = consoleError.mock.calls
      .map((call) => String(call[0]))
      .filter((message) => /hydrat|did not match|mismatch/i.test(message))

    expect(complaints).toEqual([])
    container.remove()
  })
})
