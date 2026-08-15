import { describe, expect, it } from 'vitest'
import { projects, site } from '../content'
import { absoluteUrl, homeMeta, metaForPath, notFoundMeta, renderMetaHtml } from './meta'

describe('absoluteUrl', () => {
  it('joins the configured site url with a path', () => {
    expect(absoluteUrl('/projects/arena')).toBe(`${site.url}/projects/arena`)
  })
})

describe('metaForPath', () => {
  it('returns the home metadata for the root', () => {
    expect(metaForPath('/')).toEqual(homeMeta())
  })

  it('matches a project page by slug, with or without a trailing slash', () => {
    const project = projects[0]
    expect(metaForPath(`/projects/${project.slug}`).title).toContain(project.title)
    expect(metaForPath(`/projects/${project.slug}/`).title).toContain(project.title)
  })

  it('falls back to the not-found metadata for unknown paths', () => {
    expect(metaForPath('/projects/does-not-exist')).toEqual(notFoundMeta())
    expect(metaForPath('/nope')).toEqual(notFoundMeta())
  })

  it('marks the not-found page as noindex', () => {
    expect(notFoundMeta().noindex).toBe(true)
  })
})

describe('renderMetaHtml', () => {
  it('emits a title plus canonical and Open Graph tags', () => {
    const html = renderMetaHtml(homeMeta())
    expect(html).toContain('<title>')
    expect(html).toContain('rel="canonical"')
    expect(html).toContain('property="og:title"')
    expect(html).toContain('name="twitter:card"')
  })

  it('escapes quotes and angle brackets so content cannot break out of an attribute', () => {
    const html = renderMetaHtml({
      title: 'A "quoted" <tag>',
      description: 'Ampersand & "quotes"',
      path: '/',
    })
    expect(html).toContain('&quot;quoted&quot;')
    expect(html).not.toMatch(/content="[^"]*"[a-z]/)
    expect(html).toContain('Ampersand &amp;')
  })

  it('only advertises a robots tag when the page should be hidden', () => {
    expect(renderMetaHtml(homeMeta())).not.toContain('name="robots"')
    expect(renderMetaHtml(notFoundMeta())).toContain('content="noindex"')
  })
})
