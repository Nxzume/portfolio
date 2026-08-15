/**
 * Decap writes JSON loosely: cleared number fields come back as "", list
 * widgets save objects instead of strings, and new entries omit lists
 * entirely. Everything here turns that into the shapes the components expect.
 *
 * Kept free of imports so it can be unit tested on its own.
 */
import type {
  AboutContent,
  ContactContent,
  Focus,
  HeroContent,
  Project,
  ProjectSection,
  SectionCopy,
  SiteContent,
  Sketch,
} from './types'

type Row = Record<string, unknown>

function asRow(value: unknown): Row {
  return value && typeof value === 'object' ? (value as Row) : {}
}

export function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function optionalStr(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

export function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/** List widgets may hold plain strings or single-field objects. */
export function textItems(value: unknown): string[] {
  return asList(value)
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') {
        const row = item as Row
        for (const key of ['paragraph', 'item', 'label', 'title', 'text']) {
          const candidate = row[key]
          if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
        }
      }
      return ''
    })
    .filter(Boolean)
}

export function galleryItems(value: unknown): string[] {
  return asList(value)
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      const image = asRow(item).image
      return typeof image === 'string' ? image.trim() : ''
    })
    .filter(Boolean)
}

export function slugify(value: unknown, fallback: string): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return fallback
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || fallback
}

/** Two entries sharing an id would make one page unreachable or highlight the wrong row. */
export function dedupe<T>(items: T[], key: (item: T) => string, withKey: (item: T, key: string) => T) {
  const seen = new Set<string>()
  return items.map((item) => {
    const original = key(item)
    if (!seen.has(original)) {
      seen.add(original)
      return item
    }
    let n = 2
    while (seen.has(`${original}-${n}`)) n += 1
    const next = `${original}-${n}`
    seen.add(next)
    return withKey(item, next)
  })
}

export function sectionCopy(raw: unknown): SectionCopy {
  const row = asRow(raw)
  return {
    eyebrow: str(row.eyebrow),
    title: str(row.title),
    lede: str(row.lede),
  }
}

export function normalizeSite(raw: unknown): SiteContent {
  const row = asRow(raw)
  const links = asRow(row.links)
  return {
    name: str(row.name, 'Your name'),
    tagline: str(row.tagline),
    email: str(row.email),
    url: str(row.url).trim().replace(/\/+$/, ''),
    links: Object.fromEntries(
      Object.entries(links).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === 'string' && entry[1].trim() !== '',
      ),
    ),
  }
}

export function normalizeAbout(raw: unknown): AboutContent {
  const row = asRow(raw)
  return {
    portrait: str(row.portrait).trim(),
    portraitAlt: optionalStr(str(row.portraitAlt).trim()),
    lead: str(row.lead),
    body: textItems(row.body),
    note: optionalStr(str(row.note).trim()),
  }
}

export function normalizeContact(raw: unknown): ContactContent {
  const row = asRow(raw)
  return {
    eyebrow: str(row.eyebrow),
    title: str(row.title),
    lede: str(row.lede),
    emailButtonText: optionalStr(str(row.emailButtonText).trim()),
  }
}

function normalizeCta(raw: unknown, fallbackLabel: string) {
  const row = asRow(raw)
  return {
    label: str(row.label, fallbackLabel),
    href: str(row.href, '#'),
  }
}

export function normalizeHero(raw: unknown): HeroContent {
  const row = asRow(raw)
  return {
    headline: str(row.headline),
    image: str(row.image).trim(),
    primaryCta: normalizeCta(row.primaryCta, 'Listen'),
    secondaryCta: normalizeCta(row.secondaryCta, 'Projects'),
  }
}

export function normalizeFocuses(raw: unknown): Focus[] {
  const list = Array.isArray(raw) ? raw : asList(asRow(raw).tabs)
  return list
    .map((item, i) => {
      const row = asRow(item)
      const label = str(row.label, `Tab ${i + 1}`)
      return {
        id: slugify(row.id, slugify(label, `tab-${i + 1}`)),
        label,
        headline: str(row.headline),
        body: str(row.body),
      }
    })
    .filter((tab) => tab.label.trim() !== '' || tab.headline.trim() !== '')
}

export function normalizeSection(raw: unknown, index: number): ProjectSection {
  const row = asRow(raw)
  return {
    id: typeof row.id === 'string' && row.id.trim() ? row.id.trim() : `section-${index + 1}`,
    title: str(row.title, `Section ${index + 1}`),
    paragraphs: textItems(row.paragraphs),
    image: optionalStr(str(row.image).trim()),
    imageAlt: optionalStr(str(row.imageAlt).trim()),
    quote: optionalStr(str(row.quote).trim()),
  }
}

export function normalizeProject(raw: unknown, index: number): Project {
  const row = asRow(raw)
  const fallbackId = `project-${index + 1}`

  const links = asList(row.links)
    .map((item) => {
      const link = asRow(item)
      const label = str(link.label).trim()
      const href = str(link.href).trim()
      return label && href ? { label, href } : null
    })
    .filter((link): link is { label: string; href: string } => link != null)

  return {
    id: slugify(row.id, slugify(row.slug, fallbackId)),
    slug: slugify(row.slug, slugify(row.id, fallbackId)),
    order: num(row.order),
    title: str(row.title, 'Untitled project'),
    subtitle: str(row.subtitle),
    image: str(row.image).trim(),
    gallery: galleryItems(row.gallery),
    summary: str(row.summary),
    highlights: textItems(row.highlights),
    links,
    intro: textItems(row.intro),
    sections: asList(row.sections).map(normalizeSection),
  }
}

export function normalizeProjects(entries: unknown[]): Project[] {
  const projects = entries.map((entry, i) => normalizeProject(entry, i))
  return dedupe(
    projects,
    (project) => project.slug,
    (project, slug) => ({ ...project, slug }),
  ).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
}

export function normalizeSketch(raw: unknown, index: number): Sketch {
  const row = asRow(raw)
  const title = str(row.title)

  const patternRaw = row.pattern
  const pattern = Array.isArray(patternRaw)
    ? patternRaw
        .map((step) => (step && typeof step === 'object' ? num(asRow(step).step) : num(step)))
        .filter((value): value is number => value != null)
    : undefined

  return {
    id: slugify(row.id, slugify(title, `track-${index + 1}`)),
    title,
    mood: optionalStr(row.mood),
    bpm: num(row.bpm),
    audio: optionalStr(row.audio),
    baseFreq: num(row.baseFreq),
    pattern: pattern?.length ? pattern : undefined,
  }
}

export function normalizeSketches(raw: unknown): Sketch[] {
  const list = Array.isArray(raw) ? raw : asList(asRow(raw).tracks)
  return dedupe(
    list.map((item, i) => normalizeSketch(item, i)),
    (track) => track.id,
    (track, id) => ({ ...track, id }),
  )
}
