;(function completeLogin() {
  const resultNode = document.getElementById('oauth-result')
  if (!resultNode || !window.opener) return

  let result
  try {
    result = JSON.parse(resultNode.textContent)
  } catch {
    return
  } finally {
    resultNode.remove()
  }

  function receiveMessage(event) {
    if (event.origin !== result.origin) return
    window.opener.postMessage(result.message, result.origin)
  }

  window.addEventListener('message', receiveMessage, false)
  window.opener.postMessage('authorizing:github', result.origin)
})()