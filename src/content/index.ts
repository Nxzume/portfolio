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
}) as Record<string, Project>

function loadProjects(): Project[] {
  return Object.entries(projectModules)
    .filter(([path]) => !path.includes('/_'))
    .map(([, data]) => data)
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
