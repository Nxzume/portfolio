import { m } from 'framer-motion'
import type { ReactNode } from 'react'
import { easeOutExpo } from '../lib/motion'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
}

/** Clip-up section header. */
export function SectionReveal({ children, className = 'section__head', delay = 0 }: Props) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 40, clipPath: 'inset(0 0 40% 0)' }}
      whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.85, delay, ease: easeOutExpo }}
    >
      {children}
    </m.div>
  )
}
