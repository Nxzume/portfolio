/**
 * GitHub OAuth callback — Decap CMS. Logic lives in _oauthCore.js so the
 * Netlify function behaves identically.
 */
import { completeAuth } from './_oauthCore.js'

export default async function handler(req, res) {
  const { status, headers, body } = await completeAuth(req)
  res.statusCode = status
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value)
  res.end(body)
}
