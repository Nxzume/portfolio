import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { content } from '../../content'
import { ContentProvider } from '../../content/context'
import { HomeLayout } from './HomeLayout'
import { sentences, socialLinks, spotifyEmbeds, splitProjects } from './data'

function renderHome() {
  return renderToString(
    <StrictMode>
      <StaticRouter location="/">
        <ContentProvider value={content}>
          <HomeLayout />
        </ContentProvider>
      </StaticRouter>
    </StrictMode>,
  )
}

describe('homepage data helpers', () => {
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

describe('homepage layout', () => {
  it('renders the real site content', () => {
    const html = renderHome()
    expect(html).toContain('id="main"')
    expect(html).toContain(content.site.name)
    expect(html).toContain(content.site.email)
    for (const project of content.projects) {
      expect(html).toContain(project.title)
    }
    expect(html).toContain('open.spotify.com/embed')
  })

  it('gives the piano keyboard one key per section', () => {
    const html = renderHome()
    for (const id of ['listen', 'worlds', 'craft', 'about', 'contact']) {
      expect(html).toContain(`href="#${id}"`)
      expect(html).toContain(`id="${id}"`)
    }
  })
})
