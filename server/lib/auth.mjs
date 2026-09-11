import { createHmac, timingSafeEqual } from 'node:crypto'

const MAX_FAILS = 5
const LOCK_MS = 5 * 60 * 1000

/** Stateless HMAC-signed session cookie + login rate limiting. */
export function createAuth({ password, secret, ttlHours = 12 }) {
  if (!password) return null
  const fails = new Map() // ip -> { count, lockedUntil }

  function sign(payload) {
    return createHmac('sha256', secret).update(payload).digest('base64url')
  }

  function safeEqual(a, b) {
    const ba = Buffer.from(String(a))
    const bb = Buffer.from(String(b))
    return ba.length === bb.length && timingSafeEqual(ba, bb)
  }

  return {
    cookieName: 'ag_session',

    checkPassword(candidate) {
      const digest = (v) => createHmac('sha256', 'login').update(String(v)).digest()
      return timingSafeEqual(digest(candidate), digest(password))
    },

    issueCookie() {
      const payload = String(Date.now() + ttlHours * 3600 * 1000)
      return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
    },

    verifyCookie(value) {
      if (typeof value !== 'string') return false
      const dot = value.lastIndexOf('.')
      if (dot < 0) return false
      const b64 = value.slice(0, dot)
      const sig = value.slice(dot + 1)
      const payload = Buffer.from(b64, 'base64url').toString('utf8')
      if (!safeEqual(sig, sign(payload))) return false
      const exp = Number(payload)
      return Number.isFinite(exp) && exp > Date.now()
    },

    isLocked(ip) {
      const entry = fails.get(ip)
      if (!entry) return false
      if (entry.lockedUntil && entry.lockedUntil > Date.now()) return true
      if (entry.lockedUntil && entry.lockedUntil <= Date.now()) fails.delete(ip)
      return false
    },

    recordFail(ip) {
      const entry = fails.get(ip) || { count: 0, lockedUntil: 0 }
      entry.count += 1
      if (entry.count >= MAX_FAILS) {
        entry.lockedUntil = Date.now() + LOCK_MS
        entry.count = 0
      }
      fails.set(ip, entry)
    },

    resetFails(ip) {
      fails.delete(ip)
    },
  }
}

export function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim())
  }
  return out
}
