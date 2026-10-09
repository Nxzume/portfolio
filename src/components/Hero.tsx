import { m, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useContent } from '../content/context'
import { useHomeReveal } from '../context/HomeRevealContext'
import { easeOutExpo, easeStudio } from '../lib/motion'
import { safeHref } from '../lib/urls'

type Props = {
  intensity: number
}

function SplitBrand({ text, reveal, delay }: { text: string; reveal: boolean; delay: number }) {
  const words = text.split(' ')
  return (
    <m.p className="hero__brand" aria-label={text}>
      {words.map((word, wi) => (
        <span className="hero__brand-word" key={`${word}-${wi}`}>
          {word.split('').map((ch, i) => (
            <m.span
              key={`${wi}-${i}-${ch}`}
              className="hero__brand-char"
              initial={{ y: '110%', opacity: 0 }}
              animate={reveal ? { y: '0%', opacity: 1 } : { y: '110%', opacity: 0 }}
              transition={{
                duration: 0.85,
                delay: delay + wi * 0.12 + i * 0.028,
                ease: easeOutExpo,
              }}
            >
              {ch}
            </m.span>
          ))}
          {wi < words.length - 1 ? <span className="hero__brand-space"> </span> : null}
        </span>
      ))}
    </m.p>
  )
}

export function Hero({ intensity }: Props) {
  const { hero, site } = useContent()
  const phase = useHomeReveal()
  const reveal = phase !== 'intro'
  const baseDelay = phase === 'revealing' ? 0.7 : 0.05
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const mediaY = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.18])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])
  const glow = Math.min(0.55, 0.22 + intensity * 0.35)

  return (
    <section className="hero" id="top" ref={ref}>
      <m.div className="hero__media" aria-hidden style={{ y: mediaY, scale: mediaScale }}>
        {hero.image ? (
          <img
            className="hero__image"
            src={hero.image}
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        ) : null}
        <div className="hero__veil" />
        <m.div
          className="hero__glow"
          animate={{ opacity: reveal ? glow : 0 }}
          transition={{ duration: 0.8 }}
        />
      </m.div>

      <m.div className="hero__content" style={{ y: contentY, opacity: contentOpacity }}>
        <m.p
          className="hero__kicker"
          initial={{ opacity: 0, x: -24 }}
          animate={reveal ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.7, delay: baseDelay, ease: easeStudio }}
        >
          Composer portfolio
        </m.p>

        <SplitBrand text={site.name} reveal={reveal} delay={baseDelay + 0.05} />

        <m.h1
          initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
          animate={
            reveal
              ? { opacity: 1, clipPath: 'inset(0 0 0% 0)' }
              : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }
          }
          transition={{ duration: 0.9, delay: baseDelay + 0.45, ease: easeOutExpo }}
        >
          {hero.headline}
        </m.h1>

        <m.p
          className="hero__lede"
          initial={{ opacity: 0, y: 24 }}
          animate={reveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.75, delay: baseDelay + 0.58, ease: easeStudio }}
        >
          {site.tagline}
        </m.p>

        <m.div
          className="hero__cta"
          initial={{ opacity: 0, y: 20 }}
          animate={reveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7, delay: baseDelay + 0.7, ease: easeStudio }}
        >
          <a className="btn btn--primary" href={safeHref(hero.primaryCta.href)}>
            {hero.primaryCta.label}
          </a>
          <a className="btn btn--ghost" href={safeHref(hero.secondaryCta.href)}>
            {hero.secondaryCta.label}
          </a>
        </m.div>
      </m.div>
    </section>
  )
}
