/** Shared GitHub App configuration helpers for Decap CMS. */
export function requestOrigin() {
  try {
    const url = new URL(process.env.SITE_URL?.trim() || '')
    const isOrigin =
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    return isOrigin ? url.origin : ''
  } catch {
    return ''
  }
}

export function resolveAppConfig() {
  const clientId = process.env.GITHUB_APP_CLIENT_ID?.trim() || ''
  return {
    clientId,
    clientIdSource: clientId ? 'env' : 'none',
  }
}
