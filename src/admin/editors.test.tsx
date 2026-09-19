import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import focusesJson from '../../content/focuses.json'
import sketchesJson from '../../content/sketches.json'
import { FocusesEditor, SketchesEditor } from './editors'

describe('list editors with wrapped file shapes', () => {
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

  it('SketchesEditor lists tracks from { tracks: [...] } files', async () => {
    root = createRoot(container)
    await act(async () => {
      root.render(
        <SketchesEditor value={sketchesJson} onChange={() => {}} openLibrary={() => {}} />,
      )
    })
    const values = [...container.querySelectorAll('input')].map((input) => input.value)
    const tracks = sketchesJson.tracks as { title?: string }[]
    for (const track of tracks) {
      if (track.title) expect(values).toContain(track.title)
    }
  })

  it('SketchesEditor keeps the { tracks } wrapper when adding a track', async () => {
    let saved: unknown
    root = createRoot(container)
    await act(async () => {
      root.render(
        <SketchesEditor value={sketchesJson} onChange={(next) => { saved = next }} openLibrary={() => {}} />,
      )
    })
    const addButton = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Add track'))!
    await act(async () => {
      addButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    const next = saved as { tracks: unknown[] }
    expect(Array.isArray(next.tracks)).toBe(true)
    expect(next.tracks).toHaveLength((sketchesJson.tracks as unknown[]).length + 1)
  })

  it('FocusesEditor lists tabs from { tabs: [...] } files', async () => {
    root = createRoot(container)
    await act(async () => {
      root.render(<FocusesEditor value={focusesJson} onChange={() => {}} openLibrary={() => {}} />)
    })
    const values = [...container.querySelectorAll('input')].map((input) => input.value)
    const tabs = focusesJson.tabs as { label?: string }[]
    for (const tab of tabs) {
      if (tab.label) expect(values).toContain(tab.label)
    }
  })

  it('FocusesEditor keeps the { tabs } wrapper when adding a tab', async () => {
    let saved: unknown
    root = createRoot(container)
    await act(async () => {
      root.render(<FocusesEditor value={focusesJson} onChange={(next) => { saved = next }} openLibrary={() => {}} />)
    })
    const addButton = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Add tab'))!
    await act(async () => {
      addButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    const next = saved as { tabs: unknown[] }
    expect(Array.isArray(next.tabs)).toBe(true)
    expect(next.tabs).toHaveLength((focusesJson.tabs as unknown[]).length + 1)
  })
})
