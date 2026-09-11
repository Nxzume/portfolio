import { m } from 'framer-motion'
import { useContent } from '../content/context'
import { WaveformCanvas } from './WaveformCanvas'

type Props = {
  intensity: number
}

export function Hero({ intensity }: Props) {
  const { hero, site, focuses } = useContent()
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
      </div>

      <div className="hero__content">
        <m.p
          className="hero__disciplines"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
        >
          {focuses.map((f, i) => (
            <span key={f.id}>
              <span className="hero__discipline-num">{String(i + 1).padStart(2, '0')}</span>
              {f.label}
            </span>
          ))}
        </m.p>
        <m.p
          className="hero__brand"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          {site.name}
        </m.p>
        <m.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.28 }}
        >
          {hero.headline}
        </m.h1>
        <m.p
          className="hero__lede"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {site.tagline}
        </m.p>
        <m.div
          className="hero__cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.52 }}
        >
          <a className="btn btn--primary" href={hero.primaryCta.href}>
            {hero.primaryCta.label}
          </a>
          <a className="btn btn--ghost" href={hero.secondaryCta.href}>
            {hero.secondaryCta.label}
          </a>
        </m.div>
      </div>

      <WaveformCanvas className="hero__wave" intensity={Math.max(intensity, 0.28)} />
    </section>
  )
}
