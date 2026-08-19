/**
 * Safe status check — no secrets returned.
 */
import { requestOrigin, resolveAppConfig } from './_githubOAuth.js'

export async function oauthStatus(req) {
  const { clientId, clientIdSource } = await resolveAppConfig(req)
  const hasClientId = Boolean(clientId)
  const hasClientSecret = Boolean(process.env.GITHUB_APP_CLIENT_SECRET?.trim())
  const hasSiteUrl = Boolean(requestOrigin(req))
  const ok = hasClientId && hasClientSecret && hasSiteUrl

  return {
    status: ok ? 200 : 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(
      {
        ok,
        authType: 'github-app',
        hasClientId,
        hasClientSecret,
        hasSiteUrl,
        clientIdSource,
        configurationReady: ok,
        repositoryBinding: 'verified-during-login',
      },
      null,
      2,
    ),
  }
}

export default async function handler(req, res) {
  const { status, headers, body } = await oauthStatus(req)
  res.statusCode = status
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value)
  res.end(body)
}
