import { describe, expect, it } from 'vitest'
import {
  extractFileId,
  isMediaPath,
  isUuid,
  MEDIA_PUBLIC_PREFIX,
} from '../../cms/lib/media.mjs'
import { heroFromDirectus, projectFromDirectus } from '../../cms/lib/content-map.mjs'

describe('media helpers', () => {
  it('detects uuids and media paths', () => {
    expect(isUuid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true)
    expect(isUuid('/images/hero.jpg')).toBe(false)
    expect(isMediaPath('/images/hero.jpg')).toBe(true)
    expect(isMediaPath('/audio/track.mp3')).toBe(true)
    expect(isMediaPath('/media/x.png')).toBe(true)
    expect(isMediaPath('https://example.com/x.png')).toBe(false)
  })

  it('extracts file ids from strings and expanded objects', () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    expect(extractFileId(id)).toBe(id)
    expect(extractFileId({ id, filename_download: 'hero.jpg' })).toBe(id)
    expect(extractFileId('/images/hero.jpg')).toBe('')
    expect(extractFileId(null)).toBe('')
  })

  it('heroFromDirectus accepts expanded file objects', () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const hero = heroFromDirectus({
      headline: 'Hi',
      image: { id, filename_download: 'hero.png' },
      primary_cta_label: 'A',
      primary_cta_href: '#a',
      secondary_cta_label: 'B',
      secondary_cta_href: '#b',
    })
    expect(hero.image).toBe(id)
  })

  it('projectFromDirectus normalizes gallery file refs', () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const project = projectFromDirectus({
      slug: 'demo',
      title: 'Demo',
      image: id,
      gallery: [
        { directus_files_id: id },
        { directus_files_id: { id, filename_download: 'g.png' } },
      ],
      sections: [{ section_id: 's', title: 'S', image: id, paragraphs: [] }],
    })
    expect(project.image).toBe(id)
    expect(project.gallery[0].image).toBe(id)
    expect(project.gallery[1].image).toBe(id)
    expect(project.sections[0].id).toBe('s')
    expect(project.sections[0].image).toBe(id)
  })

  it('uses /media public prefix', () => {
    expect(MEDIA_PUBLIC_PREFIX).toBe('/media')
  })
})
