/**
 * GitHub OAuth start — used by Decap CMS Login.
 * Set GITHUB_CLIENT_ID in Vercel (from a GitHub OAuth App).
 */
export function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return new Response(
      'Missing GITHUB_CLIENT_ID. Create a GitHub OAuth App and add the env var in Vercel.',
      { status: 500 },
    )
  }

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('scope', 'repo user')
  return Response.redirect(url.toString(), 302)
}
