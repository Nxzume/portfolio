import {
  normalizeAbout,
  normalizeContact,
  normalizeFocuses,
  normalizeHero,
  normalizeHome,
  normalizeProjects,
  normalizeScore,
  normalizeSite,
  normalizeSketches,
  sectionCopy,
} from './normalize'
import type {
  AboutContent,
  ContactContent,
  Focus,
  HeroContent,
  HomeContent,
  Project,
  ScoreContent,
  SectionCopy,
  SiteContent,
  Sketch,
} from './types'

/** Raw JSON payloads exactly as stored in content/*.json. */
export type RawContentFiles = {
  site: unknown
  about: unknown
  contact: unknown
  hero: unknown
  focuses: unknown
  sketches: unknown
  score: unknown
  projectsSection: unknown
  home?: unknown
  projects: unknown[]
}

/** Normalized content for the whole site, ready for components. */
export type Content = {
  site: SiteContent
  about: AboutContent
  contact: ContactContent
  hero: HeroContent
  focuses: Focus[]
  sketches: Sketch[]
  score: ScoreContent
  projectsSection: SectionCopy
  home: HomeContent
  projects: Project[]
}

export function buildContent(raw: RawContentFiles): Content {
  return {
    site: normalizeSite(raw.site),
    about: normalizeAbout(raw.about),
    contact: normalizeContact(raw.contact),
    hero: normalizeHero(raw.hero),
    focuses: normalizeFocuses(raw.focuses),
    sketches: normalizeSketches(raw.sketches),
    score: normalizeScore(raw.score),
    projectsSection: sectionCopy(raw.projectsSection),
    home: normalizeHome(raw.home),
    projects: normalizeProjects(raw.projects),
  }
}

export function findProject(content: Content, slug: string): Project | undefined {
  return content.projects.find((project) => project.slug === slug)
}
