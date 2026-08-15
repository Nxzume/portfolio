import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { projects, site } from './content'
import { render, routes, sitemapRoutes } from './entry-server'

describe('routes', () => {
  it('covers the homepage, every project, and the 404', () => {
    expect(routes()).toEqual([
      '/',
      ...projects.map((project) => `/projects/${project.slug}`),
      '/404',
    ])
  })

  it('leaves the 404 out of the sitemap', () => {
    expect(sitemapRoutes()).not.toContain('/404')
  })
})

describe('render', () => {
  it('puts the homepage copy in the markup instead of an empty shell', () => {
    const { html, head } = render('/')
    expect(html).toContain(site.name)
    expect(html).toContain('id="main"')
    expect(head).toContain('<title>')
  })

  it('renders each project page with its own title and canonical url', () => {
    for (const project of projects) {
      const { html, head } = render(`/projects/${project.slug}`)
      expect(html).toContain(project.title)
      expect(head).toContain(`${site.url}/projects/${project.slug}`)
    }
  })

  it('renders the 404 route without falling back to the homepage', () => {
    const { html, head } = render('/404')
    expect(head).toContain('content="noindex"')
    expect(html).toContain('That page moved or never existed')
  })
})

describe('hydration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('reuses the prerendered markup without a mismatch', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { html } = render('/')
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)

    await act(async () => {
      hydrateRoot(
        container,
        <StrictMode>
          <BrowserRouter>
            <App />
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
