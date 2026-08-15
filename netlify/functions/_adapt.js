/**
 * Bridges Netlify's function signature to the plain request/response shape the
 * shared OAuth core uses.
 */
export function toRequest(event) {
  const query = new URLSearchParams(event.queryStringParameters || {}).toString()
  return {
    headers: event.headers || {},
    url: `${event.path || '/'}${query ? `?${query}` : ''}`,
  }
}

export function toResponse({ status, headers, body }) {
  return { statusCode: status, headers, body: body ?? '' }
}
