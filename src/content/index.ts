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
export const focuses = focusesJson as Focus[]
export const sketches = sketchesJson as Sketch[]
export const score = scoreJson as SectionCopy
export const contact = contactJson as ContactContent
export const hero = heroJson as HeroContent
export const projectsSection = projectsSectionJson as SectionCopy
export const projects = loadProjects()

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug)
}

export type { FocusId, Project, Sketch } from './types'
