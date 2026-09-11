import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { absoluteUrl, homeMeta, metaForPath, notFoundMeta, renderMetaHtml } from './meta'

describe('absoluteUrl', () => {
  it('joins the configured site url with a path', () => {
    expect(absoluteUrl(content.site.url, '/projects/arena')).toBe(`${content.site.url}/projects/arena`)
  })

  it('passes through absolute http(s) urls', () => {
    expect(absoluteUrl(content.site.url, 'https://cdn.example/a.png')).toBe('https://cdn.example/a.png')
  })
})

describe('metaForPath', () => {
  it('returns the home metadata for the root', () => {
    expect(metaForPath(content, '/')).toEqual(homeMeta(content))
  })

  it('matches a project page by slug, with or without a trailing slash', () => {
    const project = content.projects[0]
    expect(metaForPath(content, `/projects/${project.slug}`).title).toContain(project.title)
    expect(metaForPath(content, `/projects/${project.slug}/`).title).toContain(project.title)
  })

  it('falls back to the not-found metadata for unknown paths', () => {
    expect(metaForPath(content, '/projects/does-not-exist')).toEqual(notFoundMeta(content))
    expect(metaForPath(content, '/nope')).toEqual(notFoundMeta(content))
  })

  it('marks the not-found page as noindex', () => {
    expect(notFoundMeta(content).noindex).toBe(true)
  })
})

describe('renderMetaHtml', () => {
  it('emits a title plus canonical and Open Graph tags', () => {
    const html = renderMetaHtml(homeMeta(content), content.site)
    expect(html).toContain('<title>')
    expect(html).toContain('rel="canonical"')
    expect(html).toContain('property="og:title"')
    expect(html).toContain('name="twitter:card"')
  })

  it('escapes quotes and angle brackets so content cannot break out of an attribute', () => {
    const html = renderMetaHtml(
      {
        title: 'A "quoted" <tag>',
        description: 'Ampersand & "quotes"',
        path: '/',
      },
      content.site,
    )
    expect(html).toContain('&quot;quoted&quot;')
    expect(html).not.toMatch(/content="[^"]*"[a-z]/)
    expect(html).toContain('Ampersand &amp;')
  })

  it('only advertises a robots tag when the page should be hidden', () => {
    expect(renderMetaHtml(homeMeta(content), content.site)).not.toContain('name="robots"')
    expect(renderMetaHtml(notFoundMeta(content), content.site)).toContain('content="noindex"')
  })
})
