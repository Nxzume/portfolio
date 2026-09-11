import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import aboutJson from '../../content/about.json'
import contactJson from '../../content/contact.json'
import focusesJson from '../../content/focuses.json'
import heroJson from '../../content/hero.json'
import projectsSectionJson from '../../content/projects-section.json'
import arenaJson from '../../content/projects/arena.json'
import levelJson from '../../content/projects/level.json'
import scoreJson from '../../content/score.json'
import siteJson from '../../content/site.json'
import sketchesJson from '../../content/sketches.json'
import { LivePreview } from './LivePreview'
import { rawFromFiles } from './previewContent'

const files = {
  site: siteJson,
  about: aboutJson,
  contact: contactJson,
  hero: heroJson,
  focuses: focusesJson,
  sketches: sketchesJson,
  score: scoreJson,
  'projects-section': projectsSectionJson,
  'projects/arena': arenaJson,
  'projects/level': levelJson,
}

describe('rawFromFiles', () => {
  it('maps file keys onto the content loader shape', () => {
    const raw = rawFromFiles(files)
    expect(raw.site).toBe(siteJson)
    expect(raw.projectsSection).toBe(projectsSectionJson)
    expect(raw.projects).toEqual([arenaJson, levelJson])
  })
})

describe('LivePreview', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('renders the homepage from files and reflects unsaved drafts instantly', async () => {
    root = createRoot(container)
    await act(async () => {
      root.render(<LivePreview files={files} drafts={{}} selection="hero" />)
    })
    expect(container.textContent).toContain(heroJson.headline)

    const drafts = { hero: { ...heroJson, headline: 'Unsaved draft headline' } }
    await act(async () => {
      root.render(<LivePreview files={files} drafts={drafts} selection="hero" />)
    })
    expect(container.textContent).toContain('Unsaved draft headline')
  })

  it('renders the selected project page', async () => {
    root = createRoot(container)
    await act(async () => {
      root.render(<LivePreview files={files} drafts={{}} selection="projects/arena" />)
    })
    expect(container.textContent).toContain(arenaJson.title)
  })
})
