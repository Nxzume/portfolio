import aboutJson from '../../content/about.json'
import contactJson from '../../content/contact.json'
import focusesJson from '../../content/focuses.json'
import heroJson from '../../content/hero.json'
import projectsSectionJson from '../../content/projects-section.json'
import scoreJson from '../../content/score.json'
import siteJson from '../../content/site.json'
import sketchesJson from '../../content/sketches.json'
import {
  normalizeAbout,
  normalizeContact,
  normalizeFocuses,
  normalizeHero,
  normalizeProjects,
  normalizeSite,
  normalizeSketches,
  sectionCopy,
} from './normalize'

const projectModules = import.meta.glob('../../content/projects/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

export const site = normalizeSite(siteJson)
export const about = normalizeAbout(aboutJson)
export const focuses = normalizeFocuses(focusesJson)
export const sketches = normalizeSketches(sketchesJson)
export const score = sectionCopy(scoreJson)
export const contact = normalizeContact(contactJson)
export const hero = normalizeHero(heroJson)
export const projectsSection = sectionCopy(projectsSectionJson)

export const projects = normalizeProjects(
  Object.entries(projectModules)
    // content/projects/_templates holds starter files, not real entries.
    .filter(([path]) => !path.includes('/_'))
    .map(([, data]) => data),
)

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug)
}

export type { FocusId, Project, Sketch } from './types'
