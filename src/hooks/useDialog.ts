import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Shared behaviour for the lightbox and the mobile menu: lock page scroll,
 * close on Escape, keep Tab inside the panel, and hand focus back on close.
 * Returns the ref to attach to the panel element.
 */
export function useDialog<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!active) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const node = ref.current
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])

    const first = focusables()[0]
    if (first) first.focus()
    else node?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !node) return

      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      const outside = !node.contains(document.activeElement)

      if (event.shiftKey && (outside || document.activeElement === firstItem)) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && (outside || document.activeElement === lastItem)) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [active])

  return ref
}
