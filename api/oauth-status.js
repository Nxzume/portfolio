/**
 * Safe status check — no secrets returned.
 */
import { resolveClientId } from './_githubOAuth.js'

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
        productionUrl: 'https://portfolio-five-steel-37.vercel.app',
        next: !hasClientId
          ? 'Set githubClientId in public/admin/oauth-public.json OR GITHUB_CLIENT_ID in Vercel, then Redeploy.'
          : !hasClientSecret
            ? 'Add GITHUB_CLIENT_SECRET in Vercel → Environment Variables (Production + Preview), then Redeploy.'
            : 'Open /admin/ and Login with GitHub.',
      },
      null,
      2,
    ),
  )
}
