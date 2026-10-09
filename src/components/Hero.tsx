import { m, useScroll, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { ResponsiveImg } from './ResponsiveImg'
import { useContent } from '../content/context'
import { useHomeReveal } from '../context/HomeRevealContext'
import { useCssScrollTimeline } from '../hooks/useCssScrollTimeline'
import { useMotionBudget } from '../hooks/useMotionBudget'
import { easeOutExpo, easeStudio, gpuTransformTemplate } from '../lib/motion'
import { safeHref } from '../lib/urls'

type Props = {
  intensity: number
}

function SplitBrand({
  text,
  reveal,
  delay,
  compact,
}: {
  text: string
  reveal: boolean
  delay: number
  compact: boolean
}) {
  const words = text.split(' ')

  if (compact) {
    return (
      <m.p className="hero__brand" aria-label={text}>
        {words.map((word, wi) => (
          <m.span
            className="hero__brand-word"
            key={`${word}-${wi}`}
            initial={{ y: '110%', opacity: 0 }}
            animate={reveal ? { y: '0%', opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{
              duration: 0.7,
              delay: delay + wi * 0.1,
              ease: easeOutExpo,
            }}
            style={{ display: 'inline-block' }}
          >
            {word}
            {wi < words.length - 1 ? <span className="hero__brand-space"> </span> : null}
          </m.span>
        ))}
      </m.p>
    )
  }

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

function HeroCopy({
  reveal,
  baseDelay,
  compact,
  name,
  headline,
  tagline,
  primaryCta,
  secondaryCta,
}: {
  reveal: boolean
  baseDelay: number
  compact: boolean
  name: string
  headline: string
  tagline: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}) {
  return (
    <>
      <m.p
        className="hero__kicker"
        initial={{ opacity: 0, x: -24 }}
        animate={reveal ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
        transition={{ duration: 0.7, delay: baseDelay, ease: easeStudio }}
      >
        Composer portfolio
      </m.p>

      <SplitBrand text={name} reveal={reveal} delay={baseDelay + 0.05} compact={compact} />

      <m.h1
        initial={{ opacity: 0, y: 28 }}
        animate={reveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
        transition={{ duration: 0.9, delay: baseDelay + 0.45, ease: easeOutExpo }}
      >
        {headline}
      </m.h1>

      <m.p
        className="hero__lede"
        initial={{ opacity: 0, y: 24 }}
        animate={reveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.75, delay: baseDelay + 0.58, ease: easeStudio }}
      >
        {tagline}
      </m.p>

      <m.div
        className="hero__cta"
        initial={{ opacity: 0, y: 20 }}
        animate={reveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.7, delay: baseDelay + 0.7, ease: easeStudio }}
      >
        <a className="btn btn--primary" href={safeHref(primaryCta.href)}>
          {primaryCta.label}
        </a>
        <a className="btn btn--ghost" href={safeHref(secondaryCta.href)}>
          {secondaryCta.label}
        </a>
      </m.div>
    </>
  )
}

function HeroMedia({
  image,
  glow,
  reveal,
}: {
  image: string
  glow: number
  reveal: boolean
}) {
  return (
    <>
      {image ? (
        <ResponsiveImg
          className="hero__image"
          src={image}
          layout="full"
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
    </>
  )
}

function HeroFramerFallback({
  intensity,
  reveal,
  copy,
  image,
}: {
  intensity: number
  reveal: boolean
  copy: ReactNode
  image: string
}) {
  const budget = useMotionBudget()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const mediaY = useTransform(scrollYProgress, [0, 1], budget.heroMediaY)
  const mediaScale = useTransform(scrollYProgress, [0, 1], budget.heroMediaScale)
  const contentY = useTransform(scrollYProgress, [0, 1], budget.heroContentY)
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])
  const glow = Math.min(0.55, 0.22 + intensity * 0.35)

  return (
    <section className="hero" id="top" ref={ref}>
      <m.div
        className="hero__media gpu-scroll"
        aria-hidden
        style={{ y: mediaY, scale: mediaScale }}
        transformTemplate={gpuTransformTemplate}
      >
        <HeroMedia image={image} glow={glow} reveal={reveal} />
      </m.div>
      <m.div
        className="hero__content gpu-scroll"
        style={{ y: contentY, opacity: contentOpacity }}
        transformTemplate={gpuTransformTemplate}
      >
        {copy}
      </m.div>
    </section>
  )
}

export function Hero({ intensity }: Props) {
  const { hero, site } = useContent()
  const phase = useHomeReveal()
  const reveal = phase !== 'intro'
  const baseDelay = phase === 'revealing' ? 0.7 : 0.05
  const budget = useMotionBudget()
  const cssTimeline = useCssScrollTimeline()
  const glow = Math.min(0.55, 0.22 + intensity * 0.35)
  const copy = (
    <HeroCopy
      reveal={reveal}
      baseDelay={baseDelay}
      compact={budget.compact}
      name={site.name}
      headline={hero.headline}
      tagline={site.tagline}
      primaryCta={hero.primaryCta}
      secondaryCta={hero.secondaryCta}
    />
  )

  if (cssTimeline) {
    return (
      <section className="hero" id="top">
        <div className="hero__media gpu-scroll parallax-hero-media" aria-hidden>
          <HeroMedia image={hero.image} glow={glow} reveal={reveal} />
        </div>
        <div className="hero__content gpu-scroll parallax-hero-content">{copy}</div>
      </section>
    )
  }

  return (
    <HeroFramerFallback
      intensity={intensity}
      reveal={reveal}
      copy={copy}
      image={hero.image}
    />
  )
}
