/**
 * Netlify Function wrapper — same OAuth start as /api/auth.
 */
export async function handler() {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return {
      statusCode: 500,
      body: 'Missing GITHUB_CLIENT_ID',
    }
  }

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('scope', 'repo user')

  return {
    statusCode: 302,
    headers: { Location: url.toString() },
    body: '',
  }
}
