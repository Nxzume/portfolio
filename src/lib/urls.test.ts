import { describe, expect, it } from 'vitest'
import { isExternalHref, safeHref } from './urls'

describe('safeHref', () => {
  it('keeps relative, hash, mailto, tel, and http(s) links', () => {
    expect(safeHref('/projects/level')).toBe('/projects/level')
    expect(safeHref('#compose')).toBe('#compose')
    expect(safeHref('mailto:hi@example.com')).toBe('mailto:hi@example.com')
    expect(safeHref('tel:+15551212')).toBe('tel:+15551212')
    expect(safeHref('https://example.com')).toBe('https://example.com')
  })

  it('adds https to bare domains', () => {
    expect(safeHref('example.com/path')).toBe('https://example.com/path')
  })

  it('blocks dangerous schemes', () => {
    expect(safeHref('javascript:alert(1)')).toBe('#')
    expect(safeHref('data:text/html,hi')).toBe('#')
    expect(safeHref('vbscript:msgbox(1)')).toBe('#')
  })

  it('falls back for empty values', () => {
    expect(safeHref('')).toBe('#')
    expect(safeHref(null)).toBe('#')
  })
})

describe('isExternalHref', () => {
  it('detects absolute http(s) links after normalization', () => {
    expect(isExternalHref('https://example.com')).toBe(true)
    expect(isExternalHref('example.com')).toBe(true)
    expect(isExternalHref('/local')).toBe(false)
    expect(isExternalHref('#x')).toBe(false)
  })
})
