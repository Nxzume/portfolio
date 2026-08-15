/**
 * GitHub OAuth start — Decap CMS. Logic lives in _oauthCore.js so the Netlify
 * function behaves identically.
 */
import { startAuth } from './_oauthCore.js'

export default async function handler(req, res) {
  const { status, headers, body } = await startAuth(req)
  res.statusCode = status
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value)
  res.end(body)
}
