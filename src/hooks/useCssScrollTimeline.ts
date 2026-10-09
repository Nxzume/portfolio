import { useEffect, useState } from 'react'

/**
 * Detect CSS scroll/view timelines. When available, parallax can run entirely on
 * the compositor (no scroll → JS → React path) — the same idea as a game RAF loop.
 */
export function useCssScrollTimeline() {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const ok =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      (CSS.supports('animation-timeline: view()') ||
        CSS.supports('animation-timeline', 'view()') ||
        CSS.supports('animation-timeline: scroll()') ||
        CSS.supports('animation-timeline', 'scroll()'))
    setSupported(ok)
  }, [])

  return supported
}
