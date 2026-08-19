/**
 * Host-neutral GitHub OAuth for Decap CMS.
 *
 * Both the Vercel handlers in this folder and the Netlify functions call into
 * here, so the two hosts cannot drift apart.
 *
 * Requests return `{ status, headers, body }`; each host adapts that to its own
 * response object.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { requestOrigin, resolveAppConfig } from './_githubOAuth.js'

const AUTH_COOKIE = 'decap_github_app_session'
const AUTH_MAX_AGE = 600
const TARGET_REPOSITORY = Object.freeze({ id: '1334579175', fullName: 'Nxzume/portfolio' })
const TARGET_INSTALLATION_OWNER = 'Nxzume'
const CALLBACK_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'"
const REQUIRED_PERMISSIONS = Object.freeze({
  contents: 'write',
  pull_requests: 'write',
  statuses: 'read',
  metadata: 'read',
})

function setupPage(status = 503) {
  return {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': CALLBACK_CSP,
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
    body: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>Login unavailable</title>
<link rel="stylesheet" href="/admin/editor.css" />
</head><body>
<h1>Login isn’t set up yet</h1>
<p>Online editing requires a repository-scoped GitHub App installed by the site owner.</p>
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

function authCookie(session, origin) {
  const secure = origin.startsWith('https:') ? '; Secure' : ''
  const value = session
    ? Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
    : ''
  const maxAge = session ? AUTH_MAX_AGE : 0
  return `${AUTH_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

function readAuthSession(cookieHeader) {
  try {
    const value = parseCookies(cookieHeader)[AUTH_COOKIE]
    if (!value) return null
    const session = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (typeof session.state !== 'string' || typeof session.verifier !== 'string') return null
    return session
  } catch {
    return null
  }
}

function sameValue(left, right) {
  const leftBytes = Buffer.from(String(left || ''))
  const rightBytes = Buffer.from(String(right || ''))
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes)
}

/**
 * The popup only ever talks to the CMS running on this same origin, so the
 * token is posted there explicitly instead of to whichever window replied.
 */
function popupResponse(message, origin, extraHeaders = {}) {
  const result = JSON.stringify({ origin, message }).replace(/</g, '\\u003c')
  return {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': CALLBACK_CSP,
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      ...extraHeaders,
    },
    body: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Login</title></head>
  <body>
    <p>Finishing login… you can close this window.</p>
    <script id="oauth-result" type="application/json">${result}</script>
    <script src="/admin/oauth-callback.js"></script>
  </body>
</html>`,
  }
}

function errorMessage(message) {
  return `authorization:github:error:${JSON.stringify({ message })}`
}

function githubHeaders(accessToken) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${accessToken}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function hasExactPermissions(permissions) {
  if (!permissions || typeof permissions !== 'object') return false
  const granted = Object.entries(permissions).filter(([, value]) => Boolean(value))
  return (
    granted.length === Object.keys(REQUIRED_PERMISSIONS).length &&
    granted.every(([name, value]) => REQUIRED_PERMISSIONS[name] === value)
  )
}

async function hasOnlyTargetRepository(accessToken) {
  const installationsRes = await fetch('https://api.github.com/user/installations?per_page=100', {
    headers: githubHeaders(accessToken),
  })
  if (!installationsRes.ok) return false

  const installationData = await installationsRes.json()
  if (
    installationData.total_count !== 1 ||
    !Array.isArray(installationData.installations) ||
    installationData.installations.length !== 1
  ) {
    return false
  }

  const installation = installationData.installations[0]
  if (
    !Number.isSafeInteger(installation?.id) ||
    String(installation?.account?.login || '').toLowerCase() !==
      TARGET_INSTALLATION_OWNER.toLowerCase() ||
    installation?.repository_selection !== 'selected' ||
    !hasExactPermissions(installation?.permissions)
  ) {
    return false
  }

  const repositoriesRes = await fetch(
    `https://api.github.com/user/installations/${installation.id}/repositories?per_page=100`,
    { headers: githubHeaders(accessToken) },
  )
  if (!repositoriesRes.ok) return false

  const repositoryData = await repositoriesRes.json()
  if (
    repositoryData.total_count !== 1 ||
    !Array.isArray(repositoryData.repositories) ||
    repositoryData.repositories.length !== 1
  ) {
    return false
  }

  const repository = repositoryData.repositories[0]
  return (
    String(repository?.id || '') === TARGET_REPOSITORY.id &&
    String(repository?.full_name || '').toLowerCase() ===
      TARGET_REPOSITORY.fullName.toLowerCase()
  )
}

/** Step 1: redirect the editor to GitHub. */
export async function startAuth(req) {
  const { clientId } = await resolveAppConfig(req)
  if (!clientId) return setupPage()

  const origin = requestOrigin(req)
  if (!origin) return setupPage()

  const state = randomBytes(24).toString('base64url')
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', `${origin}/api/callback`)
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('prompt', 'select_account')

  return {
    status: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': authCookie({ state, verifier }, origin),
      'Cache-Control': 'no-store',
    },
    body: '',
  }
}

/** Step 2: exchange the code GitHub sent back for an access token. */
export async function completeAuth(req) {
  const origin = requestOrigin(req)
  const { clientId } = await resolveAppConfig(req)
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET?.trim()

  if (!origin || !clientId || !clientSecret) return setupPage()

  const clearSession = { 'Set-Cookie': authCookie(null, origin), 'Cache-Control': 'no-store' }
  const url = new URL(req.url || '/', origin)
  const code = url.searchParams.get('code')
  const oauthError = url.searchParams.get('error')
  const state = url.searchParams.get('state')
  const session = readAuthSession(req.headers?.cookie)

  if (oauthError || !code) {
    return popupResponse(errorMessage(oauthError || 'Missing code'), origin, clearSession)
  }

  // A login this handler never started should not be completed.
  if (!session || !sameValue(state, session.state)) {
    return popupResponse(
      errorMessage('Login session expired. Close this window and try again.'),
      origin,
      clearSession,
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
        code_verifier: session.verifier,
        repository_id: TARGET_REPOSITORY.id,
      }),
    })
    const tokenJson = await tokenRes.json()

    if (
      !tokenJson.access_token ||
      !String(tokenJson.access_token).startsWith('ghu_') ||
      String(tokenJson.scope || '') !== ''
    ) {
      const message = tokenJson.error_description || tokenJson.error || 'No access token'
      return popupResponse(
        errorMessage(message === 'No access token' ? 'GitHub App token required' : message),
        origin,
        clearSession,
      )
    }

    if (!(await hasOnlyTargetRepository(tokenJson.access_token))) {
      return popupResponse(
        errorMessage('This GitHub App token is not restricted to Nxzume/portfolio.'),
        origin,
        clearSession,
      )
    }

    return popupResponse(
      `authorization:github:success:${JSON.stringify({
        token: tokenJson.access_token,
        provider: 'github',
      })}`,
      origin,
      clearSession,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OAuth failed'
    return popupResponse(errorMessage(message), origin, clearSession)
  }
}

export { AUTH_COOKIE, TARGET_REPOSITORY, hasOnlyTargetRepository }
