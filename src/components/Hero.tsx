import { m } from 'framer-motion'
import { usePortfolioContent } from '../content'
import { WaveformCanvas } from './WaveformCanvas'

type Props = {
  intensity: number
}

export function Hero({ intensity }: Props) {
  const { hero, site } = usePortfolioContent()
  return (
    <section className="hero" id="top">
      <div className="hero__media" aria-hidden>
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
        <WaveformCanvas className="hero__wave" intensity={Math.max(intensity, 0.28)} />
      </div>

      <div className="hero__content">
        <m.p
          className="hero__brand"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {site.name}
        </m.p>
        <m.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.22 }}
        >
          {hero.headline}
        </m.h1>
        <m.p
          className="hero__lede"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.36 }}
        >
          {site.tagline}
        </m.p>
        <m.div
          className="hero__cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.48 }}
        >
          <a className="btn btn--primary" href={hero.primaryCta.href}>
            {hero.primaryCta.label}
          </a>
          <a className="btn btn--ghost" href={hero.secondaryCta.href}>
            {hero.secondaryCta.label}
          </a>
        </m.div>
      </div>
    </section>
  )
}
