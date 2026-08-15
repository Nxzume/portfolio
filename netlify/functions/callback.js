/**
 * Netlify Function wrapper — same OAuth callback as /api/callback.
 */
export async function handler(event) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return { statusCode: 500, body: 'Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET' }
  }

  const params = event.queryStringParameters || {}
  const code = params.code
  const oauthError = params.error

  if (oauthError || !code) {
    return htmlResponse(`authorization:github:error:${JSON.stringify({ message: oauthError || 'Missing code' })}`)
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
      return htmlResponse(`authorization:github:error:${JSON.stringify({ message })}`)
    }

    return htmlResponse(
      `authorization:github:success:${JSON.stringify({
        token: tokenJson.access_token,
        provider: 'github',
      })}`,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OAuth failed'
    return htmlResponse(`authorization:github:error:${JSON.stringify({ message })}`)
  }
}

function htmlResponse(message) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: `<!doctype html>
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
</html>`,
  }
}
