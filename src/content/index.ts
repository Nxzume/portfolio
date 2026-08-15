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

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function slugify(value: unknown, fallback: string): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return fallback
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || fallback
}

function sectionCopy(raw: unknown): SectionCopy {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    eyebrow: str(row.eyebrow),
    title: str(row.title),
    lede: str(row.lede),
  }
}

function normalizeContact(raw: unknown): ContactContent {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    eyebrow: str(row.eyebrow),
    title: str(row.title),
    lede: str(row.lede),
    emailButtonText: str(row.emailButtonText).trim() || undefined,
  }
}

function normalizeCta(raw: unknown, fallbackLabel: string): { label: string; href: string } {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    label: str(row.label, fallbackLabel),
    href: str(row.href, '#'),
  }
}

function normalizeHero(raw: unknown): HeroContent {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    headline: str(row.headline),
    image: str(row.image).trim(),
    primaryCta: normalizeCta(row.primaryCta, 'Listen'),
    secondaryCta: normalizeCta(row.secondaryCta, 'Projects'),
  }
}

/** Decap new entries often omit lists; list widgets may save objects instead of strings. */
function normalizeProject(raw: Record<string, unknown>, index: number): Project {
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

  const fallbackId = `project-${index + 1}`
  return {
    id: slugify(raw.id, slugify(raw.slug, fallbackId)),
    slug: slugify(raw.slug, slugify(raw.id, fallbackId)),
    order,
    title: str(raw.title, 'Untitled project'),
    subtitle: str(raw.subtitle),
    image: str(raw.image).trim(),
    gallery: galleryItems(raw.gallery),
    summary: str(raw.summary),
    highlights: textItems(raw.highlights),
    links,
    intro: textItems(raw.intro),
    sections: asList(raw.sections).map(normalizeSection),
  }
}

function loadProjects(): Project[] {
  const seen = new Set<string>()
  return Object.entries(projectModules)
    .filter(([path]) => !path.includes('/_'))
    .map(([, data], i) => normalizeProject(data && typeof data === 'object' ? data : {}, i))
    .map((project) => {
      // Two projects sharing a slug would make one page unreachable.
      if (!seen.has(project.slug)) {
        seen.add(project.slug)
        return project
      }
      let n = 2
      while (seen.has(`${project.slug}-${n}`)) n += 1
      const slug = `${project.slug}-${n}`
      seen.add(slug)
      return { ...project, slug }
    })
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
}

const siteRaw = (siteJson && typeof siteJson === 'object' ? siteJson : {}) as Record<string, unknown>
const linksRaw = (siteRaw.links && typeof siteRaw.links === 'object'
  ? siteRaw.links
  : {}) as Record<string, unknown>

export const site: SiteContent = {
  name: str(siteRaw.name, 'Your name'),
  tagline: str(siteRaw.tagline),
  email: str(siteRaw.email),
  links: Object.fromEntries(
    Object.entries(linksRaw).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== '',
    ),
  ),
}

const aboutRaw = (aboutJson && typeof aboutJson === 'object' ? aboutJson : {}) as Record<
  string,
  unknown
>
export const about: AboutContent = {
  portrait: str(aboutRaw.portrait).trim(),
  portraitAlt: str(aboutRaw.portraitAlt).trim() || undefined,
  lead: str(aboutRaw.lead),
  body: textItems(aboutRaw.body),
  note: str(aboutRaw.note).trim() || undefined,
}

const focusesRaw = Array.isArray(focusesJson)
  ? focusesJson
  : ((focusesJson as { tabs?: unknown }).tabs ?? [])
export const focuses: Focus[] = asList(focusesRaw)
  .map((item, i) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const label = str(row.label, `Tab ${i + 1}`)
    return {
      id: slugify(row.id, slugify(label, `tab-${i + 1}`)),
      label,
      headline: str(row.headline),
      body: str(row.body),
    }
  })
  .filter((tab) => tab.label.trim() !== '' || tab.headline.trim() !== '')
/** Decap number widgets often save cleared fields as "" — coerce before typing. */
function normalizeSketch(raw: Record<string, unknown>, index: number): Sketch {
  const num = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v)
      return Number.isFinite(n) ? n : undefined
    }
    return undefined
  }
  const optional = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() !== '' ? v : undefined
  const patternRaw = raw.pattern
  const pattern = Array.isArray(patternRaw)
    ? patternRaw
        .map((step) => {
          if (step && typeof step === 'object' && 'step' in (step as object)) {
            return num((step as { step: unknown }).step)
          }
          return num(step)
        })
        .filter((n): n is number => n != null)
    : undefined
  const title = str(raw.title)

  return {
    id: slugify(raw.id, slugify(title, `track-${index + 1}`)),
    title,
    mood: optional(raw.mood),
    bpm: num(raw.bpm),
    audio: optional(raw.audio),
    baseFreq: num(raw.baseFreq),
    pattern: pattern?.length ? pattern : undefined,
  }
}

const sketchesRaw = Array.isArray(sketchesJson)
  ? sketchesJson
  : (sketchesJson as { tracks: unknown[] }).tracks
const sketchesSeen = new Set<string>()
export const sketches = (Array.isArray(sketchesRaw) ? sketchesRaw : [])
  .map((t, i) => normalizeSketch((t && typeof t === 'object' ? t : {}) as Record<string, unknown>, i))
  .map((track) => {
    // Play state is keyed by id, so duplicates would highlight the wrong row.
    if (!sketchesSeen.has(track.id)) {
      sketchesSeen.add(track.id)
      return track
    }
    let n = 2
    while (sketchesSeen.has(`${track.id}-${n}`)) n += 1
    const id = `${track.id}-${n}`
    sketchesSeen.add(id)
    return { ...track, id }
  })
export const score = sectionCopy(scoreJson)
export const contact = normalizeContact(contactJson)
export const hero = normalizeHero(heroJson)
export const projectsSection = sectionCopy(projectsSectionJson)
export const projects = loadProjects()

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug)
}

export type { FocusId, Project, Sketch } from './types'
