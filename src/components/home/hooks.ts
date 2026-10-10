import { useEffect, useState } from 'react'

function atPageBottom() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
}

/** Highlights the section currently crossing the middle band of the viewport. */
export function useScrollSpy(ids: string[], fallback = ''): string {
  const [active, setActive] = useState(fallback || ids[0] || '')
  const key = ids.join('|')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const elements = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null)
    if (!elements.length) return

    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio)
          else visible.delete(entry.target.id)
        }
        const order = key.split('|')
        if (atPageBottom()) {
          setActive(order.at(-1) ?? '')
          return
        }
        const current = order.filter((id) => visible.has(id)).at(-1)
        if (current) setActive(current)
        else if (window.scrollY < 80) setActive(fallback || order[0])
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01] },
    )
    elements.forEach((el) => observer.observe(el))

    // The last section can be too short to reach the observer band at page end.
    const onScroll = () => {
      if (atPageBottom()) setActive(key.split('|').at(-1) ?? '')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [key, fallback])

  return active
}
