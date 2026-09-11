import aboutJson from '../../content/about.json'
import contactJson from '../../content/contact.json'
import focusesJson from '../../content/focuses.json'
import heroJson from '../../content/hero.json'
import projectsSectionJson from '../../content/projects-section.json'
import scoreJson from '../../content/score.json'
import siteJson from '../../content/site.json'
import sketchesJson from '../../content/sketches.json'
import { buildContent } from './load'

const projectModules = import.meta.glob('../../content/projects/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

/**
 * Content baked into the browser bundle at build time. The server never uses
 * this — it loads fresh files via `loadContentFromDir` and provides them
 * through `ContentProvider`.
 */
export const content = buildContent({
  site: siteJson,
  about: aboutJson,
  contact: contactJson,
  hero: heroJson,
  focuses: focusesJson,
  sketches: sketchesJson,
  score: scoreJson,
  projectsSection: projectsSectionJson,
  projects: Object.entries(projectModules)
    // content/projects/_templates holds starter files, not real entries.
    .filter(([path]) => !path.includes('/_'))
    .map(([, data]) => data),
})

export const site = content.site
export const about = content.about
export const focuses = content.focuses
export const sketches = content.sketches
export const score = content.score
export const contact = content.contact
export const hero = content.hero
export const projectsSection = content.projectsSection
export const projects = content.projects

export function getProject(slug: string) {
  return content.projects.find((p) => p.slug === slug)
}

export type { Content } from './load'
export type { FocusId, Project, Sketch } from './types'
