import { m } from 'framer-motion'
import { usePortfolioContent } from '../content'

export function About() {
  const { about, site } = usePortfolioContent()
  return (
    <section className="section about" id="about">
      <div className="about__grid">
        <m.div
          className="about__portrait"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
        >
          {about.portrait ? (
            <img
              src={about.portrait}
              alt={about.portraitAlt || site.name}
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </m.div>
        <m.div
          className="about__copy"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, delay: 0.08 }}
        >
          <h2>{about.lead}</h2>
          {about.body.map((p, i) => (
            <p key={`${i}-${p.slice(0, 24)}`}>{p}</p>
          ))}
          {about.note ? <p className="about__note">{about.note}</p> : null}
        </m.div>
      </div>
    </section>
  )
}
