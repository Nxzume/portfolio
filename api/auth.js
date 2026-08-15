/**
 * GitHub OAuth start — Decap CMS.
 *
 * Client ID resolution order:
 * 1) process.env.GITHUB_CLIENT_ID  (Vercel env)
 * 2) public/admin/oauth-public.json (safe to commit — Client ID is public)
 *
 * Client Secret must stay in Vercel as GITHUB_CLIENT_SECRET (used by /api/callback).
 */
import { requestOrigin, resolveClientId } from './_githubOAuth.js'

export default async function handler(req, res) {
  const { clientId } = await resolveClientId(req)

  if (!clientId) {
    const origin = requestOrigin(req)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>OAuth setup needed</title>
<style>body{font-family:system-ui,sans-serif;max-width:42rem;margin:2rem auto;padding:0 1rem;line-height:1.5}
code{background:#f4f4f4;padding:.15rem .4rem;border-radius:4px}li{margin:.45rem 0}</style>
</head><body>
<h1>GitHub Client ID not found</h1>
<p>Do <strong>one</strong> of these, then <strong>Redeploy</strong> on Vercel:</p>
<ol>
<li><strong>Easiest:</strong> put your OAuth Client ID in
  <code>public/admin/oauth-public.json</code> as <code>githubClientId</code>, commit, push, redeploy.</li>
<li><strong>Or</strong> in Vercel → this project → Environment Variables add
  <code>GITHUB_CLIENT_ID</code> (and <code>GITHUB_CLIENT_SECRET</code>), save, then Redeploy.</li>
</ol>
<p>OAuth App callback must be:<br/><code>${origin}/api/callback</code></p>
<p>Check: <a href="/api/oauth-status"><code>/api/oauth-status</code></a></p>
<p>Production URL: <code>https://portfolio-five-steel-37.vercel.app</code></p>
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
