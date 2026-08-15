/**
 * GitHub OAuth start — Decap CMS.
 * Classic Vercel Node handler so env vars are reliably available.
 *
 * Required env (Vercel project → Settings → Environment Variables):
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET  (used by /api/callback)
 */
export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim()

  if (!clientId) {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'YOUR-DOMAIN'
    const origin = `https://${host}`
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>OAuth setup needed</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.5}
code{background:#f4f4f4;padding:.1rem .35rem;border-radius:4px}li{margin:.4rem 0}</style>
</head><body>
<h1>Missing <code>GITHUB_CLIENT_ID</code></h1>
<p>Add it on the <strong>same Vercel project</strong> that serves this site, then redeploy.</p>
<ol>
<li>GitHub → Settings → Developer settings → <strong>OAuth Apps</strong> → New OAuth App</li>
<li>Homepage URL: <code>${origin}</code></li>
<li>Authorization callback URL: <code>${origin}/api/callback</code></li>
<li>Copy Client ID + generate Client Secret</li>
<li>Vercel → this project → Settings → Environment Variables:
  <ul>
    <li><code>GITHUB_CLIENT_ID</code> = Client ID</li>
    <li><code>GITHUB_CLIENT_SECRET</code> = Client Secret</li>
  </ul>
  Environments: Production <em>and</em> Preview
</li>
<li><strong>Redeploy</strong> (env vars only apply to new deployments)</li>
<li>Open <code>${origin}/admin/</code> again</li>
</ol>
<p>Until then, edit locally with <code>npm run dev</code> + <code>npm run cms</code> → <code>http://localhost:5173/admin/</code></p>
<p><a href="/api/oauth-status">Check /api/oauth-status</a></p>
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
