/**
 * GitHub OAuth start for Decap CMS.
 * Portable: works on Vercel (/api/*) and Netlify (redirected from /api/*).
 * Env: GITHUB_CLIENT_ID
 */
export async function handler() {
  return getResponse()
}

export function GET() {
  return getResponse()
}

function getResponse() {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return jsonOrText(
      500,
      'Missing GITHUB_CLIENT_ID. Add it in your host env vars (Vercel/Netlify/etc).',
    )
  }

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('scope', 'repo user')
  return Response.redirect(url.toString(), 302)
}

function jsonOrText(status, message) {
  return new Response(message, { status })
}
