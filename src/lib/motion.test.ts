import { describe, expect, it } from 'vitest'
import { gpuTransformTemplate } from './motion'

describe('gpuTransformTemplate', () => {
  it('promotes empty transforms with translateZ(0)', () => {
    expect(gpuTransformTemplate({}, 'none')).toBe('translateZ(0)')
    expect(gpuTransformTemplate({}, '')).toBe('translateZ(0)')
  })

  it('appends translateZ(0) to 2D transforms', () => {
    expect(gpuTransformTemplate({}, 'translateX(12px) scale(1.1)')).toBe(
      'translateX(12px) scale(1.1) translateZ(0)',
    )
  })

  it('leaves already-3D transforms alone', () => {
    expect(gpuTransformTemplate({}, 'translate3d(1px, 2px, 0)')).toBe('translate3d(1px, 2px, 0)')
    expect(gpuTransformTemplate({}, 'translateX(4px) translateZ(0)')).toBe(
      'translateX(4px) translateZ(0)',
    )
  })
})
