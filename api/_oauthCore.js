/**
 * Host-neutral GitHub OAuth for Decap CMS.
 *
 * Both the Vercel handlers in this folder and the Netlify functions call into
 * here, so the two hosts cannot drift apart.
 *
 * Requests return `{ status, headers, body }`; each host adapts that to its own
 * response object.
 */
import { randomUUID } from 'node:crypto'
import { requestOrigin, resolveClientId } from './_githubOAuth.js'

const STATE_COOKIE = 'decap_oauth_state'
const STATE_MAX_AGE = 600

/**
 * The repo is public, so read/write to public repositories is all the CMS
 * needs. Set GITHUB_OAUTH_SCOPE=repo only if the content repo becomes private —
 * `repo` grants access to every private repository the editor can see.
 */
function oauthScope() {
  return process.env.GITHUB_OAUTH_SCOPE?.trim() || 'public_repo'
}

function setupPage(status = 503) {
  return {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>Login unavailable</title>
<style>body{font-family:system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#1a1a1a}
a{color:#0b57d0}</style>
</head><body>
<h1>Login isn’t set up yet</h1>
<p>Online editing needs a one-time GitHub connection from the site owner.</p>
<p><a href="/admin/">Back to editor</a> · <a href="/">Back to site</a></p>
</body></html>`,
  }
}

function parseCookies(header) {
  const jar = {}
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=')
    if (index < 0) continue
    jar[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim())
  }
  return jar
}

function stateCookie(value, origin) {
  const secure = origin.startsWith('https:') ? '; Secure' : ''
  const maxAge = value ? STATE_MAX_AGE : 0
  return `${STATE_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

/**
 * The popup only ever talks to the CMS running on this same origin, so the
 * token is posted there explicitly instead of to whichever window replied.
 */
function popupResponse(message, origin, extraHeaders = {}) {
  return {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...extraHeaders },
    body: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Login</title></head>
  <body>
    <p>Finishing login… you can close this window.</p>
    <script>
      (function () {
        var origin = ${JSON.stringify(origin)};
        function receiveMessage(e) {
          if (e.origin !== origin) return;
          window.opener.postMessage(${JSON.stringify(message)}, origin);
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", origin);
      })();
    </script>
  </body>
</html>`,
  }
}

function errorMessage(message) {
  return `authorization:github:error:${JSON.stringify({ message })}`
}

/** Step 1: redirect the editor to GitHub. */
export async function startAuth(req) {
  const { clientId } = await resolveClientId(req)
  if (!clientId) return setupPage()

  const origin = requestOrigin(req)
  const state = randomUUID().replace(/-/g, '')

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('scope', oauthScope())
  url.searchParams.set('redirect_uri', `${origin}/api/callback`)
  url.searchParams.set('state', state)

  return {
    status: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': stateCookie(state, origin),
      'Cache-Control': 'no-store',
    },
    body: '',
  }
}

/** Step 2: exchange the code GitHub sent back for an access token. */
export async function completeAuth(req) {
  const origin = requestOrigin(req)
  const { clientId } = await resolveClientId(req)
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) return setupPage()

  const clearState = { 'Set-Cookie': stateCookie('', origin), 'Cache-Control': 'no-store' }
  const url = new URL(req.url || '/', origin)
  const code = url.searchParams.get('code')
  const oauthError = url.searchParams.get('error')
  const state = url.searchParams.get('state')
  const expectedState = parseCookies(req.headers?.cookie)[STATE_COOKIE]

  if (oauthError || !code) {
    return popupResponse(errorMessage(oauthError || 'Missing code'), origin, clearState)
  }

  // A login this handler never started should not be completed.
  if (!expectedState || state !== expectedState) {
    return popupResponse(
      errorMessage('Login session expired. Close this window and try again.'),
      origin,
      clearState,
    )
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${origin}/api/callback`,
      }),
    })
    const tokenJson = await tokenRes.json()

    if (!tokenJson.access_token) {
      const message = tokenJson.error_description || tokenJson.error || 'No access token'
      return popupResponse(errorMessage(message), origin, clearState)
    }

    return popupResponse(
      `authorization:github:success:${JSON.stringify({
        token: tokenJson.access_token,
        provider: 'github',
      })}`,
      origin,
      clearState,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OAuth failed'
    return popupResponse(errorMessage(message), origin, clearState)
  }
}

export { STATE_COOKIE, oauthScope }
