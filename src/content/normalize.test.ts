import { describe, expect, it } from 'vitest'
import {
  normalizeAbout,
  normalizeFocuses,
  normalizeHero,
  normalizeProject,
  normalizeProjects,
  normalizeSite,
  normalizeSketch,
  normalizeSketches,
  slugify,
  textItems,
} from './normalize'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('The Arena', 'x')).toBe('the-arena')
  })

  it('strips punctuation and edge hyphens', () => {
    expect(slugify('  Mothership’s Return!  ', 'x')).toBe('mothership-s-return')
  })

  it('falls back when nothing usable is left', () => {
    expect(slugify('!!!', 'fallback')).toBe('fallback')
    expect(slugify('', 'fallback')).toBe('fallback')
    expect(slugify(null, 'fallback')).toBe('fallback')
  })
})

describe('textItems', () => {
  it('accepts plain strings', () => {
    expect(textItems(['one', ' two '])).toEqual(['one', 'two'])
  })

  it('accepts the single-field objects Decap list widgets save', () => {
    expect(textItems([{ paragraph: 'a' }, { item: 'b' }, { label: 'c' }])).toEqual(['a', 'b', 'c'])
  })

  it('drops empties and non-lists', () => {
    expect(textItems([{ paragraph: '  ' }, '', null])).toEqual([])
    expect(textItems('not a list')).toEqual([])
    expect(textItems(undefined)).toEqual([])
  })
})

describe('normalizeProject', () => {
  it('fills every field for an entry saved with nothing but a title', () => {
    const project = normalizeProject({ title: 'Bare' }, 0)

    expect(project).toMatchObject({
      title: 'Bare',
      slug: 'project-1',
      id: 'project-1',
      subtitle: '',
      image: '',
      summary: '',
    })
    expect(project.gallery).toEqual([])
    expect(project.highlights).toEqual([])
    expect(project.links).toEqual([])
    expect(project.intro).toEqual([])
    expect(project.sections).toEqual([])
  })

  it('reads order back from the string a cleared number field leaves behind', () => {
    expect(normalizeProject({ order: '3' }, 0).order).toBe(3)
    expect(normalizeProject({ order: '' }, 0).order).toBeUndefined()
    expect(normalizeProject({ order: 'abc' }, 0).order).toBeUndefined()
  })

  it('derives a missing slug from the id and vice versa', () => {
    expect(normalizeProject({ id: 'arena' }, 0).slug).toBe('arena')
    expect(normalizeProject({ slug: 'level' }, 0).id).toBe('level')
  })

  it('keeps only links that have both a label and a destination', () => {
    const project = normalizeProject(
      { links: [{ label: 'Play', href: 'https://x.test' }, { label: 'Nowhere' }, { href: 'https://y.test' }] },
      0,
    )
    expect(project.links).toEqual([{ label: 'Play', href: 'https://x.test' }])
  })

  it('reads gallery entries in both the object and plain string shapes', () => {
    const project = normalizeProject({ gallery: [{ image: '/a.png' }, '/b.png', {}] }, 0)
    expect(project.gallery).toEqual(['/a.png', '/b.png'])
  })

  it('gives every chapter an anchor id', () => {
    const project = normalizeProject({ sections: [{ title: 'One' }, { title: 'Two' }] }, 0)
    expect(project.sections.map((s) => s.id)).toEqual(['section-1', 'section-2'])
  })
})

describe('normalizeProjects', () => {
  it('sorts by order and puts unordered entries last', () => {
    const projects = normalizeProjects([
      { slug: 'c', order: 5 },
      { slug: 'a', order: 1 },
      { slug: 'b' },
    ])
    expect(projects.map((p) => p.slug)).toEqual(['a', 'c', 'b'])
  })

  it('keeps duplicate slugs reachable by suffixing them', () => {
    const projects = normalizeProjects([{ slug: 'arena' }, { slug: 'arena' }, { slug: 'arena' }])
    expect(projects.map((p) => p.slug)).toEqual(['arena', 'arena-2', 'arena-3'])
  })
})

describe('normalizeSketch', () => {
  it('coerces the strings Decap number fields save', () => {
    const sketch = normalizeSketch({ title: 'Track', bpm: '120', baseFreq: '110.5' }, 0)
    expect(sketch.bpm).toBe(120)
    expect(sketch.baseFreq).toBe(110.5)
  })

  it('treats a cleared number as absent rather than zero', () => {
    const sketch = normalizeSketch({ title: 'Track', bpm: '' }, 0)
    expect(sketch.bpm).toBeUndefined()
  })

  it('reads melody steps from objects or bare numbers', () => {
    expect(normalizeSketch({ pattern: [{ step: 0 }, { step: '4' }, 7] }, 0).pattern).toEqual([0, 4, 7])
  })

  it('leaves the pattern unset when it holds nothing usable', () => {
    expect(normalizeSketch({ pattern: [] }, 0).pattern).toBeUndefined()
    expect(normalizeSketch({ pattern: [{}] }, 0).pattern).toBeUndefined()
  })

  it('derives an id from the title', () => {
    expect(normalizeSketch({ title: 'Mothership Return' }, 0).id).toBe('mothership-return')
    expect(normalizeSketch({}, 4).id).toBe('track-5')
  })
})

describe('normalizeSketches', () => {
  it('accepts both the wrapped and bare array shapes', () => {
    expect(normalizeSketches({ tracks: [{ title: 'A' }] })).toHaveLength(1)
    expect(normalizeSketches([{ title: 'A' }])).toHaveLength(1)
    expect(normalizeSketches(null)).toEqual([])
  })

  it('keeps ids unique so play state cannot target the wrong row', () => {
    const tracks = normalizeSketches([{ title: 'Same' }, { title: 'Same' }])
    expect(tracks.map((t) => t.id)).toEqual(['same', 'same-2'])
  })
})

describe('normalizeSite', () => {
  it('drops blank links so empty CMS fields do not render buttons', () => {
    const site = normalizeSite({ links: { github: 'https://g.test', linkedin: '  ' } })
    expect(site.links).toEqual({ github: 'https://g.test' })
  })

  it('strips a trailing slash from the site url', () => {
    expect(normalizeSite({ url: 'https://example.test/' }).url).toBe('https://example.test')
  })
})

describe('normalizeHero and normalizeAbout', () => {
  it('supplies button labels when the entry has none', () => {
    const hero = normalizeHero({})
    expect(hero.primaryCta).toEqual({ label: 'Listen', href: '#' })
    expect(hero.secondaryCta).toEqual({ label: 'Projects', href: '#' })
  })

  it('treats a whitespace-only note as absent', () => {
    expect(normalizeAbout({ note: '   ' }).note).toBeUndefined()
  })
})

describe('normalizeFocuses', () => {
  it('skips rows with neither a label nor a headline', () => {
    const focuses = normalizeFocuses({ tabs: [{ label: 'Compose' }, { label: '', headline: '' }] })
    expect(focuses).toHaveLength(1)
    expect(focuses[0].id).toBe('compose')
  })
})
