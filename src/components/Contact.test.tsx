import { describe, expect, it } from 'vitest'
import { linkLabel } from './Contact'

describe('linkLabel', () => {
  it('uses known brand names', () => {
    expect(linkLabel('github')).toBe('GitHub')
    expect(linkLabel('linkedin')).toBe('LinkedIn')
    expect(linkLabel('itch')).toBe('itch.io')
  })

  it('humanizes camelCase and dashed names', () => {
    expect(linkLabel('githubArena')).toBe('Github Arena')
    expect(linkLabel('my-band')).toBe('My Band')
  })
})
