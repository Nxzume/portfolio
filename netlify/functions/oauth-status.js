import { oauthStatus } from '../../api/oauth-status.js'
import { toRequest, toResponse } from './_adapt.js'

export async function handler(event) {
  return toResponse(await oauthStatus(toRequest(event)))
}