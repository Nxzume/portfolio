/**
 * GitHub OAuth start — Decap CMS.
 *
 * Client ID resolution order:
 * 1) process.env.GITHUB_CLIENT_ID  (Vercel env)
 * 2) public/admin/oauth-public.json (safe to commit — Client ID is public)
 *
 * Client Secret must stay in Vercel as GITHUB_CLIENT_SECRET (used by /api/callback).
 */
import { resolveClientId } from './_githubOAuth.js'

export default async function handler(req, res) {
  const { clientId } = await resolveClientId(req)

  if (!clientId) {
    res.statusCode = 503
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>Login unavailable</title>
<style>body{font-family:system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#1a1a1a}
a{color:#0b57d0}</style>
</head><body>
<h1>Login isn’t set up yet</h1>
<p>Online editing needs a one-time GitHub connection from the site owner.</p>
<p><a href="/admin/">Back to editor</a> · <a href="/">Back to site</a></p>
</body></html>`)
    return
  }

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('scope', 'repo user')
  res.statusCode = 302
  res.setHeader('Location', url.toString())
  res.end()
}
