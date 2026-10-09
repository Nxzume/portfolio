import { useEffect, useState } from 'react'

/** Phones / coarse pointers — where scroll+scale jank shows up most. */
const QUERY = '(max-width: 860px), (pointer: coarse)'

export type MotionBudget = {
  /** True on compact / touch-first viewports. */
  compact: boolean
  heroMediaY: [string, string]
  heroMediaScale: [number, number]
  heroContentY: [string, string]
  /** Absolute px slide-in distance for project rows. */
  projectX: number
  projectMediaScale: [number, number]
  contactScale: [number, number]
  contactY: [string, string]
  portraitY: [number, number]
}

const DESKTOP: MotionBudget = {
  compact: false,
  heroMediaY: ['0%', '28%'],
  heroMediaScale: [1, 1.18],
  heroContentY: ['0%', '18%'],
  projectX: 48,
  projectMediaScale: [1.12, 1],
  contactScale: [1.15, 1],
  contactY: ['8%', '-8%'],
  portraitY: [50, -30],
}

const MOBILE: MotionBudget = {
  compact: true,
  // Keep the same motion language, with shorter travel so mobile GPUs resample less.
  heroMediaY: ['0%', '14%'],
  heroMediaScale: [1, 1.08],
  heroContentY: ['0%', '10%'],
  projectX: 22,
  projectMediaScale: [1.06, 1],
  contactScale: [1.06, 1],
  contactY: ['4%', '-4%'],
  portraitY: [28, -16],
}

/**
 * Starts on the desktop budget so SSR/hydration match, then syncs to the
 * compact budget on narrow / coarse-pointer devices.
 */
export function useMotionBudget(): MotionBudget {
  const [budget, setBudget] = useState<MotionBudget>(DESKTOP)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const sync = () => setBudget(mq.matches ? MOBILE : DESKTOP)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return budget
}
