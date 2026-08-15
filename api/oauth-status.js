/**
 * Safe status check — does not expose secrets.
 * Open /api/oauth-status after setting env vars + redeploying.
 */
export default function handler(_req, res) {
  const hasClientId = Boolean(process.env.GITHUB_CLIENT_ID?.trim())
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
        hint: hasClientId && hasClientSecret
          ? 'OAuth env looks set. Open /admin/ and Login with GitHub.'
          : 'Add missing vars in Vercel → Environment Variables, then Redeploy.',
      },
      null,
      2,
    ),
  )
}
