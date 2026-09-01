import { describe, expect, it } from 'vitest'
import aboutJson from '../../content/about.json'
import heroJson from '../../content/hero.json'
import siteJson from '../../content/site.json'
import arenaJson from '../../content/projects/arena.json'
import {
  aboutFromDirectus,
  aboutToDirectus,
  heroFromDirectus,
  heroToDirectus,
  projectFromDirectus,
  projectToDirectus,
  siteFromDirectus,
  siteToDirectus,
} from '../../cms/lib/content-map.mjs'

describe('content-map roundtrips', () => {
  it('site', () => {
    const directus = siteToDirectus(siteJson)
    expect(siteFromDirectus(directus)).toEqual(siteJson)
  })

  it('hero', () => {
    const directus = heroToDirectus(heroJson)
    expect(heroFromDirectus(directus)).toEqual(heroJson)
  })

  it('about', () => {
    const directus = aboutToDirectus(aboutJson)
    expect(aboutFromDirectus(directus)).toEqual(aboutJson)
  })

  it('project', () => {
    const directus = projectToDirectus(arenaJson, 2)
    const back = projectFromDirectus(directus)
    expect(back.slug).toBe(arenaJson.slug)
    expect(back.title).toBe(arenaJson.title)
    expect(back.sections).toHaveLength(arenaJson.sections.length)
  })
})
