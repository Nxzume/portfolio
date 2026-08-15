/**
 * Shared GitHub OAuth helpers for Decap CMS.
 * Client ID is public; Client Secret must stay in env.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export function requestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'portfolio-five-steel-37.vercel.app'
  const proto = req.headers['x-forwarded-proto'] || 'https'
  return `${proto}://${host}`
}

export async function resolveClientId(req) {
  const fromEnv = process.env.GITHUB_CLIENT_ID?.trim()
  if (fromEnv) return { clientId: fromEnv, source: 'env' }

  const fromDisk = await readClientIdFromDisk()
  if (fromDisk) return { clientId: fromDisk, source: 'oauth-public.json' }

  if (req) {
    const fromFetch = await readClientIdFromPublicUrl(req)
    if (fromFetch) return { clientId: fromFetch, source: 'oauth-public.json' }
  }

  return { clientId: '', source: 'none' }
}

async function readClientIdFromDisk() {
  const candidates = [
    path.join(process.cwd(), 'public/admin/oauth-public.json'),
    path.join(process.cwd(), 'oauth-public.json'),
  ]
  for (const filePath of candidates) {
    try {
      const raw = await readFile(filePath, 'utf8')
      const data = JSON.parse(raw)
      const id = String(data.githubClientId || '').trim()
      if (id) return id
    } catch {
      /* try next */
    }
  }
  return ''
}

async function readClientIdFromPublicUrl(req) {
  try {
    const origin = requestOrigin(req)
    const response = await fetch(`${origin}/admin/oauth-public.json`, { cache: 'no-store' })
    if (!response.ok) return ''
    const data = await response.json()
    return String(data.githubClientId || '').trim()
  } catch {
    return ''
  }
}
