/**
 * Node-only content loader: reads content/*.json from disk at call time.
 * Used by the prerender step (build and runtime re-renders after admin
 * saves). Never imported by the browser bundle.
 */
/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { buildContent, type Content } from './load'

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

export function loadContentFromDir(dir: string): Content {
  const projectsDir = path.join(dir, 'projects')
  let projects: unknown[] = []
  try {
    projects = readdirSync(projectsDir)
      .filter((file: string) => file.endsWith('.json') && !file.startsWith('_'))
      .sort()
      .map((file: string) => readJson(path.join(projectsDir, file)))
  } catch {
    projects = []
  }

  return buildContent({
    site: readJson(path.join(dir, 'site.json')),
    about: readJson(path.join(dir, 'about.json')),
    contact: readJson(path.join(dir, 'contact.json')),
    hero: readJson(path.join(dir, 'hero.json')),
    focuses: readJson(path.join(dir, 'focuses.json')),
    sketches: readJson(path.join(dir, 'sketches.json')),
    score: readJson(path.join(dir, 'score.json')),
    projectsSection: readJson(path.join(dir, 'projects-section.json')),
    projects,
  })
}
