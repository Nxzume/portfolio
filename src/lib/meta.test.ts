import { describe, expect, it } from 'vitest'
import type { HeroContent, Project, SiteContent } from '../content/types'
import { absoluteUrl, homeMeta, metaTagSpecs, notFoundMeta, projectMeta } from './meta'

const site: SiteContent = {
  name: 'Alexandre Example',
  tagline: 'Composer and level designer based in Vancouver.',
  email: 'hello@example.com',
  url: 'https://portfolio.example.com',
  links: { github: 'https://github.com/example', linkedin: '' },
}

const hero: HeroContent = {
  headline: 'Music and worlds that pull you in',
  image: '/images/portrait.png',
  primaryCta: { label: 'See projects', href: '#projects' },
  secondaryCta: { label: 'About', href: '#about' },
}

const project: Project = {
  id: 'arena',
  slug: 'arena',
  title: 'Arena',
  subtitle: 'Competitive map',
  summary: 'A fast-paced arena for team fights.',
  image: '/images/arena-gameplay.png',
  intro: ['Built for clarity under pressure.'],
  highlights: ['Readable sightlines'],
  links: [{ label: 'Play', href: 'https://example.com' }],
  sections: [],
  gallery: [],
}

describe('absoluteUrl', () => {
  it('joins the configured site url with a path', () => {
    expect(absoluteUrl(site, '/projects/arena')).toBe(`${site.url}/projects/arena`)
  })
})

describe('homeMeta', () => {
  it('uses the site name and hero image', () => {
    const meta = homeMeta(site, hero)
    expect(meta.title).toContain(site.name)
    expect(meta.path).toBe('/')
    expect(meta.image).toBe(hero.image)
  })
})

describe('projectMeta', () => {
  it('includes the project title and canonical path', () => {
    const meta = projectMeta(site, hero, project)
    expect(meta.title).toContain(project.title)
    expect(meta.path).toBe(`/projects/${project.slug}`)
  })
})

describe('notFoundMeta', () => {
  it('marks the not-found page as noindex', () => {
    expect(notFoundMeta(site).noindex).toBe(true)
  })
})

describe('metaTagSpecs', () => {
  it('emits canonical and Open Graph tags', () => {
    const specs = metaTagSpecs(site, homeMeta(site, hero))
    expect(specs.some((s) => s.selector.includes('canonical'))).toBe(true)
    expect(specs.some((s) => s.attrs.property === 'og:title')).toBe(true)
    expect(specs.some((s) => s.attrs.name === 'twitter:card')).toBe(true)
  })

  it('only advertises a robots tag when the page should be hidden', () => {
    expect(metaTagSpecs(site, homeMeta(site, hero)).some((s) => s.attrs.name === 'robots')).toBe(
      false,
    )
    expect(metaTagSpecs(site, notFoundMeta(site)).some((s) => s.attrs.content === 'noindex')).toBe(
      true,
    )
  })
})
