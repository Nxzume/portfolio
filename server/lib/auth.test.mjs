import { describe, expect, it } from 'vitest'
import { createAuth, parseCookies } from './auth.mjs'

describe('auth', () => {
  const auth = createAuth({ password: 'hunter2', secret: 'test-secret', ttlHours: 1 })

  it('issues cookies that verify', () => {
    expect(auth.verifyCookie(auth.issueCookie())).toBe(true)
  })

  it('rejects tampered cookies', () => {
    const cookie = auth.issueCookie()
    const [b64] = cookie.split('.')
    expect(auth.verifyCookie(`${b64}.forged`)).toBe(false)
    expect(auth.verifyCookie('')).toBe(false)
    expect(auth.verifyCookie(undefined)).toBe(false)
  })

  it('rejects cookies signed with a different secret', () => {
    const other = createAuth({ password: 'hunter2', secret: 'other-secret' })
    expect(auth.verifyCookie(other.issueCookie())).toBe(false)
  })

  it('rejects expired sessions', () => {
    const expired = createAuth({ password: 'hunter2', secret: 'test-secret', ttlHours: -1 })
    expect(auth.verifyCookie(expired.issueCookie())).toBe(false)
  })

  it('checks the password', () => {
    expect(auth.checkPassword('hunter2')).toBe(true)
    expect(auth.checkPassword('nope')).toBe(false)
  })

  it('locks out after repeated failures', () => {
    const a = createAuth({ password: 'x', secret: 'y' })
    for (let i = 0; i < 5; i += 1) a.recordFail('1.2.3.4')
    expect(a.isLocked('1.2.3.4')).toBe(true)
    expect(a.isLocked('5.6.7.8')).toBe(false)
    a.resetFails('1.2.3.4')
    expect(a.isLocked('1.2.3.4')).toBe(false)
  })

  it('is null when no password is configured', () => {
    expect(createAuth({ password: '' })).toBeNull()
  })
})

describe('parseCookies', () => {
  it('parses a cookie header', () => {
    expect(parseCookies('a=1; b=two%20words')).toEqual({ a: '1', b: 'two words' })
    expect(parseCookies(undefined)).toEqual({})
  })
})
