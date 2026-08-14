import { motion } from 'framer-motion'
import { WaveformCanvas } from './WaveformCanvas'

type Props = {
  intensity: number
}

export function Hero({ intensity }: Props) {
  return (
    <section className="hero" id="top">
      <div className="hero__media" aria-hidden>
        <img
          className="hero__image"
          src="/images/level-gameplay.png"
          alt=""
          fetchPriority="high"
        />
        <div className="hero__veil" />
        <WaveformCanvas className="hero__wave" intensity={Math.max(intensity, 0.28)} />
      </div>

      <div className="hero__content">
        <motion.p
          className="hero__brand"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Alexandre Guichet
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.22 }}
        >
          Music for worlds players inhabit.
        </motion.h1>
        <motion.p
          className="hero__lede"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.36 }}
        >
          Composer for video games — also crafting level design and Azure DevOps systems.
        </motion.p>
        <motion.div
          className="hero__cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.48 }}
        >
          <a className="btn btn--primary" href="#compose">
            Hear sketches
          </a>
          <a className="btn btn--ghost" href="#projects">
            View projects
          </a>
        </motion.div>
      </div>
    </section>
  )
}
