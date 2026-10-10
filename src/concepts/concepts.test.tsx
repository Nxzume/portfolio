import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { Route, Routes, StaticRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { ContentProvider } from '../content/context'
import { routes, sitemapRoutes } from '../entry-server'
import ConceptRoutes from './ConceptRoutes'
import { concepts, sentences, socialLinks, spotifyEmbeds, splitProjects } from './data'

function renderConcept(path: string, search = '') {
  return renderToString(
    <StrictMode>
      <StaticRouter location={`${path}${search}`}>
        <ContentProvider value={content}>
          <Routes>
            <Route path="/concepts/*" element={<ConceptRoutes />} />
          </Routes>
        </ContentProvider>
      </StaticRouter>
    </StrictMode>,
  )
}

describe('concept data helpers', () => {
  it('splits sentences without trailing full stops', () => {
    expect(
      sentences('The first level teaches movement. The second teaches jump. Done.'),
    ).toEqual(['The first level teaches movement', 'The second teaches jump', 'Done'])
  })

  it('separates visual projects from tools using the real content', () => {
    const { visual, other } = splitProjects(content)
    expect(visual.length + other.length).toBe(content.projects.length)
    expect(visual.every((project) => project.image)).toBe(true)
  })

  it('dedupes spotify embeds and keeps only safe social links', () => {
    const embeds = spotifyEmbeds({
      ...content,
      score: { ...content.score, spotifyUrls: ['spotify:album:abc123', 'https://open.spotify.com/album/abc123'] },
    })
    expect(embeds).toHaveLength(1)
    const links = socialLinks({
      ...content,
      site: { ...content.site, links: { Bad: 'javascript:alert(1)', Good: 'https://example.com', Empty: '' } },
    })
    expect(links.map((link) => link.label)).toEqual(['Bad', 'Good'])
    expect(links.find((link) => link.label === 'Bad')?.href).toBe('#')
  })
})

describe('concept routes', () => {
  it('keeps the drafts out of the prerender list and sitemap', () => {
    expect(routes(content).some((route) => route.startsWith('/concepts'))).toBe(false)
    expect(sitemapRoutes(content).some((route) => route.startsWith('/concepts'))).toBe(false)
  })

  it('lists every concept on the index', () => {
    const html = renderConcept('/concepts')
    for (const concept of concepts) {
      expect(html).toContain(concept.name)
      expect(html).toContain(`/concepts/${concept.id}`)
    }
  })

  it.each(['a', 'b', 'c'])('concept %s renders the real site content', (id) => {
    const html = renderConcept(`/concepts/${id}`)
    expect(html).toContain('id="main"')
    expect(html).toContain(content.site.name)
    expect(html).toContain(content.site.email)
    for (const project of content.projects) {
      expect(html).toContain(project.title)
    }
    expect(html).toContain('open.spotify.com/embed')
    expect(html).not.toMatch(/lorem ipsum/i)
  })

  it('hides the switcher with ?bare=1', () => {
    expect(renderConcept('/concepts/a')).toContain('concept-switcher')
    expect(renderConcept('/concepts/a', '?bare=1')).not.toContain('concept-switcher')
  })

  it('gives the piano keyboard concept one key per section', () => {
    const html = renderConcept('/concepts/a')
    for (const id of ['listen', 'worlds', 'craft', 'about', 'contact']) {
      expect(html).toContain(`href="#${id}"`)
      expect(html).toContain(`id="${id}"`)
    }
  })

  it('falls through to the 404 page for unknown concepts', () => {
    expect(renderConcept('/concepts/zzz')).toContain('That page moved or never existed')
  })
})
