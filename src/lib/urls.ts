/**
 * Allow only safe URL schemes for CMS-driven hrefs.
 * Blocks javascript:/data:/vbscript: while still accepting relative paths,
 * hashes, mailto, tel, and http(s).
 */
export function safeHref(href: string | undefined | null): string {
  const value = String(href ?? '').trim()
  if (!value) return '#'

  if (
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('?') ||
    value.startsWith('./') ||
    value.startsWith('../')
  ) {
    return value
  }

  if (/^(https?:|mailto:|tel:)/i.test(value)) return value

  // Bare domains editors often type without a scheme.
  if (/^[\w.-]+\.[a-z]{2,}([/:?]|$)/i.test(value)) return `https://${value}`

  return '#'
}

export function isExternalHref(href: string | undefined | null): boolean {
  const value = safeHref(href)
  return /^(https?:)?\/\//i.test(value)
}
