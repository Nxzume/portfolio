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

  it('renders the selected project page, not the 404 fallback', async () => {
    root = createRoot(container)
    await act(async () => {
      root.render(<LivePreview files={files} drafts={{}} selection="projects/arena" />)
    })
    expect(container.textContent).not.toContain('That page moved or never existed')
    // The summary only appears on the project page itself; the 404 page
    // renders project cards with titles, which would fool a weaker check.
    expect(container.textContent).toContain(arenaJson.summary)
    expect(container.textContent).toContain(arenaJson.title)
  })

  it('clicking a section in the preview selects its editor', async () => {
    const selections: string[] = []
    root = createRoot(container)
    await act(async () => {
      root.render(
        <LivePreview files={files} drafts={{}} selection="site" onSelect={(key) => selections.push(key)} />,
      )
    })
    const about = container.querySelector('.about')!
    await act(async () => {
      about.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(selections).toEqual(['about'])
  })

  it('clicking a project row selects that project', async () => {
    const selections: string[] = []
    root = createRoot(container)
    await act(async () => {
      root.render(
        <LivePreview files={files} drafts={{}} selection="site" onSelect={(key) => selections.push(key)} />,
      )
    })
    const row = container.querySelector('.projects__row')!
    await act(async () => {
      row.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(selections).toHaveLength(1)
    expect(selections[0]).toMatch(/^projects\//)
  })

  it('renders Spotify embeds from score drafts in the live preview', async () => {
    root = createRoot(container)
    const drafts = {
      score: {
        ...scoreJson,
        spotifyUrls: ['https://open.spotify.com/artist/55kd5PVj4U0ytkH8lP9PDN'],
      },
    }
    await act(async () => {
      root.render(<LivePreview files={files} drafts={drafts} selection="score" />)
    })
    const frame = container.querySelector('iframe.score__spotify-frame') as HTMLIFrameElement | null
    expect(frame).not.toBeNull()
    expect(frame?.getAttribute('src')).toContain('open.spotify.com/embed/artist/55kd5PVj4U0ytkH8lP9PDN')
    expect(frame?.getAttribute('data-kind')).toBe('artist')
    // Uploaded sketches stay hidden while a Spotify link is set.
    expect(container.querySelector('.score__stage')).toBeNull()
  })

  it('swaps the Spotify embed when the draft URL changes', async () => {
    root = createRoot(container)
    await act(async () => {
      root.render(
        <LivePreview
          files={files}
          drafts={{
            score: {
              ...scoreJson,
              spotifyUrls: ['https://open.spotify.com/artist/55kd5PVj4U0ytkH8lP9PDN'],
            },
          }}
          selection="score"
        />,
      )
    })
    await act(async () => {
      root.render(
        <LivePreview
          files={files}
          drafts={{
            score: {
              ...scoreJson,
              spotifyUrls: ['https://open.spotify.com/album/3L7Uc171AQBKX0lKxPYWud'],
            },
          }}
          selection="score"
        />,
      )
    })
    const frame = container.querySelector('iframe.score__spotify-frame') as HTMLIFrameElement | null
    expect(frame?.getAttribute('src')).toContain('open.spotify.com/embed/album/3L7Uc171AQBKX0lKxPYWud')
  })
})
