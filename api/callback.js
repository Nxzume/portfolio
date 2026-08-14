/**
 * GitHub OAuth callback for Decap CMS.
 * Expects GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET in Vercel env.
 */
export async function GET(request) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return new Response('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET', { status: 500 })
  }

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const oauthError = requestUrl.searchParams.get('error')

  if (oauthError || !code) {
    const message = oauthError || 'Missing code'
    return htmlResponse(postMessageHtml(`authorization:github:error:${JSON.stringify({ message })}`))
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })
    const tokenJson = await tokenRes.json()

    if (!tokenJson.access_token) {
      const message = tokenJson.error_description || tokenJson.error || 'No access token'
      return htmlResponse(postMessageHtml(`authorization:github:error:${JSON.stringify({ message })}`))
    }

    const success = `authorization:github:success:${JSON.stringify({
      token: tokenJson.access_token,
      provider: 'github',
    })}`
    return htmlResponse(postMessageHtml(success))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OAuth failed'
    return htmlResponse(postMessageHtml(`authorization:github:error:${JSON.stringify({ message })}`))
  }
}

function htmlResponse(body) {
  return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function postMessageHtml(message) {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Login</title></head>
  <body>
    <p>Finishing login… you can close this window.</p>
    <script>
      (function () {
        function receiveMessage(e) {
          window.opener.postMessage(${JSON.stringify(message)}, e.origin);
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script>
  </body>
</html>`
}
