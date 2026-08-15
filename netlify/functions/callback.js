/**
 * Netlify Function wrapper — same OAuth callback as /api/callback.
 */
import { completeAuth } from '../../api/_oauthCore.js'
import { toRequest, toResponse } from './_adapt.js'

export async function handler(event) {
  return toResponse(await completeAuth(toRequest(event)))
}
