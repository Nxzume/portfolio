import { describe, expect, it } from 'vitest'
import { responsiveImage } from './images'

describe('responsiveImage', () => {
  it('maps known /images paths to optimized WebP srcset', () => {
    const img = responsiveImage('/images/level-gameplay.png')
    expect(img.src).toBe('/images/optimized/level-gameplay-960.webp')
    expect(img.srcSet).toContain('level-gameplay-960.webp 960w')
    expect(img.srcSet).toContain('level-gameplay-1600.webp 1600w')
  })

  it('passes through unknown paths', () => {
    const img = responsiveImage('https://cdn.example/x.png')
    expect(img.src).toBe('https://cdn.example/x.png')
    expect(img.srcSet).toBeUndefined()
  })
})
