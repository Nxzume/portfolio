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

/** Loads an extra Google font stylesheet only while a concept needs it. */
export function useStylesheet(id: string, href: string) {
  useEffect(() => {
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
    return () => link.remove()
  }, [id, href])
}

/** Reading progress 0..1 for the whole document. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return progress
}
