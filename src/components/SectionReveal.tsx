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
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ duration: 0.75, delay, ease: easeOutExpo }}
    >
      {children}
    </m.div>
  )
}
