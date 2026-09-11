import type { RawContentFiles } from '../content/load'

/** Raw file map (content files + drafts merged) -> the shape buildContent expects. */
export function rawFromFiles(files: Record<string, unknown>): RawContentFiles {
  return {
    site: files['site'],
    about: files['about'],
    contact: files['contact'],
    hero: files['hero'],
    focuses: files['focuses'],
    sketches: files['sketches'],
    score: files['score'],
    projectsSection: files['projects-section'],
    projects: Object.keys(files)
      .filter((key) => key.startsWith('projects/'))
      .sort()
      .map((key) => files[key]),
  }
}
