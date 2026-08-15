/**
 * GitHub OAuth callback — Decap CMS.
 * Classic Vercel Node handler so env vars are reliably available.
 */
import { resolveClientId } from './_githubOAuth.js'

export default async function handler(req, res) {
  const { clientId } = await resolveClientId(req)
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    res.statusCode = 503
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>Login unavailable</title>
<style>body{font-family:system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:0 1rem;line-height:1.5}</style>
</head><body>
<h1>Login isn’t set up yet</h1>
<p>Online editing needs a one-time GitHub connection from the site owner.</p>
<p><a href="/admin/">Back to editor</a></p>
</body></html>`)
    return
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const requestUrl = new URL(req.url || '/', `${proto}://${host}`)
  const code = requestUrl.searchParams.get('code')
  const oauthError = requestUrl.searchParams.get('error')

  if (oauthError || !code) {
    return sendPostMessage(res, `authorization:github:error:${JSON.stringify({ message: oauthError || 'Missing code' })}`)
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })
    const tokenJson = await tokenRes.json()

    if (!tokenJson.access_token) {
      const message = tokenJson.error_description || tokenJson.error || 'No access token'
      return sendPostMessage(res, `authorization:github:error:${JSON.stringify({ message })}`)
    }

    return sendPostMessage(
      res,
      `authorization:github:success:${JSON.stringify({
        token: tokenJson.access_token,
        provider: 'github',
      })}`,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OAuth failed'
    return sendPostMessage(res, `authorization:github:error:${JSON.stringify({ message })}`)
  }
}

function sendPostMessage(res, message) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Login</title></head>
  <body>
    <p>Finishing login… you can close this window.</p>
    <script>
      (function () {
        function receiveMessage(e) {
          window.opener.postMessage(${JSON.stringify(message)}, e.origin);
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script>
  </body>
</html>`)
}
