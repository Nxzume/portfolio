import type {
  AboutContent,
  ContactContent,
  Focus,
  HeroContent,
  Project,
  SectionCopy,
  SiteContent,
  Sketch,
} from './types'

import siteJson from '../../content/site.json'
import aboutJson from '../../content/about.json'
import focusesJson from '../../content/focuses.json'
import sketchesJson from '../../content/sketches.json'
import scoreJson from '../../content/score.json'
import contactJson from '../../content/contact.json'
import heroJson from '../../content/hero.json'
import projectsSectionJson from '../../content/projects-section.json'

const projectModules = import.meta.glob('../../content/projects/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function textItems(value: unknown): string[] {
  return asList(value)
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') {
        const row = item as Record<string, unknown>
        for (const key of ['paragraph', 'item', 'label', 'title', 'text']) {
          const v = row[key]
          if (typeof v === 'string' && v.trim()) return v.trim()
        }
      }
      return ''
    })
    .filter(Boolean)
}

function galleryItems(value: unknown): string[] {
  return asList(value)
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') {
        const image = (item as Record<string, unknown>).image
        if (typeof image === 'string' && image.trim()) return image.trim()
      }
      return ''
    })
    .filter(Boolean)
}

function normalizeSection(raw: unknown, index: number): Project['sections'][number] {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const id =
    typeof row.id === 'string' && row.id.trim()
      ? row.id.trim()
      : `section-${index + 1}`
  return {
    id,
    title: typeof row.title === 'string' ? row.title : `Section ${index + 1}`,
    paragraphs: textItems(row.paragraphs),
    image: typeof row.image === 'string' && row.image.trim() ? row.image.trim() : undefined,
    imageAlt: typeof row.imageAlt === 'string' && row.imageAlt.trim() ? row.imageAlt.trim() : undefined,
    quote: typeof row.quote === 'string' && row.quote.trim() ? row.quote.trim() : undefined,
  }
}

/** Decap new entries often omit lists; list widgets may save objects instead of strings. */
function normalizeProject(raw: Record<string, unknown>): Project {
  const links = asList(raw.links)
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const label = typeof row.label === 'string' ? row.label.trim() : ''
      const href = typeof row.href === 'string' ? row.href.trim() : ''
      if (!label || !href) return null
      return { label, href }
    })
    .filter((link): link is { label: string; href: string } => link != null)

  const orderRaw = raw.order
  let order: number | undefined
  if (typeof orderRaw === 'number' && Number.isFinite(orderRaw)) order = orderRaw
  else if (typeof orderRaw === 'string' && orderRaw.trim() !== '') {
    const n = Number(orderRaw)
    if (Number.isFinite(n)) order = n
  }

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : 'project',
    slug: typeof raw.slug === 'string' && raw.slug.trim() ? raw.slug.trim() : 'project',
    order,
    title: typeof raw.title === 'string' ? raw.title : 'Untitled project',
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : '',
    image: typeof raw.image === 'string' ? raw.image : '',
    gallery: galleryItems(raw.gallery),
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    highlights: textItems(raw.highlights),
    links,
    intro: textItems(raw.intro),
    sections: asList(raw.sections).map(normalizeSection),
  }
}

function loadProjects(): Project[] {
  return Object.entries(projectModules)
    .filter(([path]) => !path.includes('/_'))
    .map(([, data]) => normalizeProject(data && typeof data === 'object' ? data : {}))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
}

export const site = siteJson as SiteContent
export const about = aboutJson as AboutContent
export const focuses = (Array.isArray(focusesJson)
  ? focusesJson
  : (focusesJson as { tabs: Focus[] }).tabs) as Focus[]
/** Decap number widgets often save cleared fields as "" — coerce before typing. */
function normalizeSketch(raw: Record<string, unknown>): Sketch {
  const num = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v)
      return Number.isFinite(n) ? n : undefined
    }
    return undefined
  }
  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() !== '' ? v : undefined
  const patternRaw = raw.pattern
  const pattern = Array.isArray(patternRaw)
    ? patternRaw.map((step) => num(step)).filter((n): n is number => n != null)
    : undefined

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    mood: str(raw.mood),
    bpm: num(raw.bpm),
    audio: str(raw.audio),
    baseFreq: num(raw.baseFreq),
    pattern: pattern?.length ? pattern : undefined,
  }
}

const sketchesRaw = Array.isArray(sketchesJson)
  ? sketchesJson
  : (sketchesJson as { tracks: unknown[] }).tracks
export const sketches = (Array.isArray(sketchesRaw) ? sketchesRaw : []).map((t) =>
  normalizeSketch((t && typeof t === 'object' ? t : {}) as Record<string, unknown>),
)
export const score = scoreJson as SectionCopy
export const contact = contactJson as ContactContent
export const hero = heroJson as HeroContent
export const projectsSection = projectsSectionJson as SectionCopy
export const projects = loadProjects()

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug)
}

export type { FocusId, Project, Sketch } from './types'
