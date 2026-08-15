/**
 * Netlify Function wrapper — same OAuth start as /api/auth.
 */
import { startAuth } from '../../api/_oauthCore.js'
import { toRequest, toResponse } from './_adapt.js'

export async function handler(event) {
  return toResponse(await startAuth(toRequest(event)))
}
