import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { completeAuth, hasOnlyTargetRepository, startAuth } from '../api/_oauthCore.js'
import { oauthStatus } from '../api/oauth-status.js'

const SITE_ORIGIN = 'https://portfolio-five-steel-37.vercel.app'
const REPOSITORY_ID = '1334579175'

function checkAdminPolicy() {
  const html = readFileSync('public/admin/index.html', 'utf8')
  const config = readFileSync('public/admin/cms-config.yml', 'utf8')
  const boot = readFileSync('public/admin/boot.js', 'utf8')
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'))
  const netlify = readFileSync('netlify.toml', 'utf8')

  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .filter((match) => match[1].trim())
  assert.equal(inlineScripts.length, 0, 'admin HTML must not contain executable inline scripts')

  const externalScripts = [...html.matchAll(/<script\s+([\s\S]*?)><\/script>/gi)]
    .map((match) => match[1])
    .filter((attributes) => /\bsrc=/.test(attributes))
  for (const attributes of externalScripts.filter((value) => /https:\/\//.test(value))) {
    assert.match(attributes, /\bintegrity="sha384-[^"]+"/)
    assert.match(attributes, /\bcrossorigin="anonymous"/)
  }

  assert.match(
    html,
    /js-yaml@4\.3\.1[\s\S]*integrity="sha384-S9ICdlb\+JXmKnf3zbM1G\+PBNWbhB7ARTUpJyvroFrHHHR8JsKt4oO\+kPyfzbT\+TM"/,
  )
  assert.match(
    html,
    /decap-cms@3\.8\.3[\s\S]*integrity="sha384-zQmFlOQ\/XomwFYm\/TxeQ5kACvVVgZ\/QRhxcvWOYmR2S1ruSgHYPc\/XJYllIrLyIB"/,
  )
  assert.doesNotMatch(html, /js-yaml@4\.1\.0|preview\.js/)
  assert.equal(existsSync('public/admin/preview.js'), false)
  assert.equal(existsSync('public/admin/oauth-public.json'), false)
  assert.doesNotMatch(config, /preview:\s*true/)
  assert.match(boot, /preview:\s*false/)

  const adminHeaders = vercel.headers.find((route) => route.source === '/admin/(.*)')?.headers || []
  const vercelCsp = adminHeaders.find((header) => header.key === 'Content-Security-Policy')?.value
  assert.match(vercelCsp || '', /script-src 'self' https:\/\/unpkg\.com/)
  assert.match(vercelCsp || '', /frame-src 'none'/)
  assert.match(netlify, /Content-Security-Policy = ".*script-src 'self' https:\/\/unpkg\.com/)
  assert.match(netlify, /from = "\/api\/oauth-status"/)
  assert.equal(existsSync('netlify/functions/oauth-status.js'), true)
}

function authRequest(startResponse, authorizeUrl) {
  return {
    headers: { cookie: startResponse.headers['Set-Cookie'].split(';')[0] },
    url: `/api/callback?code=test-code&state=${authorizeUrl.searchParams.get('state')}`,
  }
}

async function checkRepositoryScopedAuth() {
  const originalEnv = { ...process.env }
  const originalFetch = globalThis.fetch
  try {
    delete process.env.GITHUB_APP_CLIENT_ID
    delete process.env.GITHUB_APP_CLIENT_SECRET
    process.env.GITHUB_CLIENT_ID = 'legacy-client'
    process.env.GITHUB_CLIENT_SECRET = 'legacy-secret'
    process.env.GITHUB_REPOSITORY_ID = '42'
    process.env.SITE_URL = SITE_ORIGIN

    const legacyResponse = await startAuth({ headers: { host: 'attacker.example' } })
    assert.equal(legacyResponse.status, 503, 'classic OAuth credentials must be ignored')

    process.env.GITHUB_APP_CLIENT_ID = 'Iv1.repository-scoped'
    process.env.GITHUB_APP_CLIENT_SECRET = 'app-secret'

    process.env.SITE_URL = 'http://portfolio.example'
    const insecureOriginResponse = await startAuth({ headers: { host: 'attacker.example' } })
    assert.equal(insecureOriginResponse.status, 503, 'online auth must require an HTTPS SITE_URL')
    process.env.SITE_URL = 'https://portfolio.example/not-an-origin'
    const pathOriginResponse = await startAuth({ headers: { host: 'attacker.example' } })
    assert.equal(pathOriginResponse.status, 503, 'SITE_URL must be a bare origin')
    process.env.SITE_URL = SITE_ORIGIN

    const startResponse = await startAuth({
      headers: { host: 'attacker.example', 'x-forwarded-host': 'attacker.example' },
    })
    assert.equal(startResponse.status, 302)

    const authorizeUrl = new URL(startResponse.headers.Location)
    assert.equal(authorizeUrl.origin, 'https://github.com')
    assert.equal(authorizeUrl.pathname, '/login/oauth/authorize')
    assert.equal(authorizeUrl.searchParams.has('scope'), false)
    assert.equal(authorizeUrl.searchParams.get('redirect_uri'), `${SITE_ORIGIN}/api/callback`)
    assert.equal(authorizeUrl.searchParams.get('code_challenge_method'), 'S256')
    assert.match(authorizeUrl.searchParams.get('code_challenge') || '', /^[A-Za-z0-9_-]{43}$/)
    assert.match(startResponse.headers['Set-Cookie'], /HttpOnly; SameSite=Lax;[^\r\n]*Secure/)

    const readyStatus = await oauthStatus({ headers: { host: 'attacker.example' } })
    assert.equal(readyStatus.status, 200)
    assert.deepEqual(
      JSON.parse(readyStatus.body),
      {
        ok: true,
        authType: 'github-app',
        hasClientId: true,
        hasClientSecret: true,
        hasSiteUrl: true,
        clientIdSource: 'env',
        configurationReady: true,
        repositoryBinding: 'verified-during-login',
      },
    )

    const requests = []
    globalThis.fetch = async (url, options = {}) => {
      requests.push({ url: String(url), options })
      if (String(url) === 'https://github.com/login/oauth/access_token') {
        return new Response(
          JSON.stringify({ access_token: 'ghu_repository_scoped', scope: '', token_type: 'bearer' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (String(url) === 'https://api.github.com/user/installations?per_page=100') {
        return new Response(
          JSON.stringify({
            total_count: 1,
            installations: [
              {
                id: 99,
                account: { login: 'Nxzume' },
                repository_selection: 'selected',
                permissions: {
                  contents: 'write',
                  pull_requests: 'write',
                  statuses: 'read',
                  metadata: 'read',
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (
        String(url) ===
        'https://api.github.com/user/installations/99/repositories?per_page=100'
      ) {
        return new Response(
          JSON.stringify({
            total_count: 1,
            repositories: [{ id: Number(REPOSITORY_ID), full_name: 'Nxzume/portfolio' }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      throw new Error(`Unexpected request: ${url}`)
    }

    const callbackResponse = await completeAuth(authRequest(startResponse, authorizeUrl))
    assert.equal(callbackResponse.status, 200)
    assert.match(callbackResponse.body, /authorization:github:success/)
    assert.match(callbackResponse.body, /ghu_repository_scoped/)
    assert.match(callbackResponse.headers['Content-Security-Policy'], /script-src 'self'/)
    const callbackInlineScripts = [
      ...callbackResponse.body.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi),
    ].filter((match) => !/\btype="application\/json"/.test(match[1]) && match[2].trim())
    assert.equal(callbackInlineScripts.length, 0)

    const tokenRequest = JSON.parse(requests[0].options.body)
    assert.equal(tokenRequest.repository_id, REPOSITORY_ID)
    assert.match(tokenRequest.code_verifier, /^[A-Za-z0-9_-]{43}$/)
    assert.equal(requests[1].options.headers.Authorization, 'Bearer ghu_repository_scoped')
    assert.equal(requests[2].options.headers.Authorization, 'Bearer ghu_repository_scoped')

    const broadStart = await startAuth({ headers: { host: SITE_ORIGIN } })
    const broadAuthorizeUrl = new URL(broadStart.headers.Location)
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ access_token: 'gho_broad_token', scope: 'public_repo' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    const broadResponse = await completeAuth(authRequest(broadStart, broadAuthorizeUrl))
    assert.doesNotMatch(broadResponse.body, /authorization:github:success/)
    assert.match(broadResponse.body, /GitHub App token required/)

    const wrongRepositoryStart = await startAuth({ headers: { host: SITE_ORIGIN } })
    const wrongRepositoryAuthorizeUrl = new URL(wrongRepositoryStart.headers.Location)
    globalThis.fetch = async (url) => {
      if (String(url) === 'https://github.com/login/oauth/access_token') {
        return new Response(JSON.stringify({ access_token: 'ghu_wrong_repository', scope: '' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (String(url) === 'https://api.github.com/user/installations?per_page=100') {
        return new Response(
          JSON.stringify({
            total_count: 1,
            installations: [
              {
                id: 99,
                account: { login: 'Nxzume' },
                repository_selection: 'selected',
                permissions: {
                  contents: 'write',
                  pull_requests: 'write',
                  statuses: 'read',
                  metadata: 'read',
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response(
        JSON.stringify({
          total_count: 2,
          repositories: [
            { id: Number(REPOSITORY_ID), full_name: 'Nxzume/portfolio' },
            { id: 1, full_name: 'Nxzume/other' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    const wrongRepositoryResponse = await completeAuth(
      authRequest(wrongRepositoryStart, wrongRepositoryAuthorizeUrl),
    )
    assert.doesNotMatch(wrongRepositoryResponse.body, /authorization:github:success/)
    assert.match(wrongRepositoryResponse.body, /not restricted to Nxzume\/portfolio/)

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          total_count: 1,
          installations: [
            {
              id: 99,
              account: { login: 'Nxzume' },
              repository_selection: 'selected',
              permissions: {
                contents: 'write',
                pull_requests: 'write',
                statuses: 'read',
                metadata: 'read',
                administration: 'write',
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    assert.equal(await hasOnlyTargetRepository('ghu_extra_permission'), false)
  } finally {
    globalThis.fetch = originalFetch
    process.env = originalEnv
  }
}

checkAdminPolicy()
await checkRepositoryScopedAuth()
console.log('Security checks passed')