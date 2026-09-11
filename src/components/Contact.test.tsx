import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { ContentProvider } from '../content/context'
import { buildContent } from '../content/load'
import { Contact } from './Contact'

function contentWithLinks(links: Record<string, string>) {
  return buildContent({
    site: { name: 'Alexandre Guichet', email: 'a@b.c', url: '', tagline: '', links },
    about: {},
    contact: { eyebrow: '', title: 'Contact', lede: '' },
    hero: {},
    focuses: [],
    sketches: [],
    score: {},
    projectsSection: {},
    projects: [],
  })
}

function renderContact(links: Record<string, string>) {
  return renderToString(
    <ContentProvider value={contentWithLinks(links)}>
      <Contact />
    </ContentProvider>,
  )
}

describe('Contact links', () => {
  it('shows each link name verbatim as the button label', () => {
    const html = renderContact({ 'My GitHub': 'https://github.com/x', itch: 'https://itch.io/x' })
    expect(html).toContain('My GitHub')
    expect(html).toContain('itch')
    expect(html).not.toContain('>GitHub<')
  })

  it('hides links without a URL', () => {
    const html = renderContact({ GitHub: '' })
    expect(html).not.toContain('GitHub')
  })
})
