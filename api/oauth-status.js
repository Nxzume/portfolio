/**
 * Safe status check — no secrets returned.
 */
import { resolveClientId } from './_githubOAuth.js'
import { oauthScope } from './_oauthCore.js'

export default async function handler(req, res) {
  const { clientId, source } = await resolveClientId(req)
  const hasClientId = Boolean(clientId)
  const hasClientSecret = Boolean(process.env.GITHUB_CLIENT_SECRET?.trim())

  res.statusCode = hasClientId && hasClientSecret ? 200 : 503
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(
    JSON.stringify(
      {
        ok: hasClientId && hasClientSecret,
        hasClientId,
        hasClientSecret,
        clientIdSource: source,
        scope: oauthScope(),
      },
      null,
      2,
    ),
  )
}
