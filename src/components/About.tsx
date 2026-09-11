import { m } from 'framer-motion'
import { useContent } from '../content/context'

export function About() {
  const { about, site } = useContent()
  return (
    <section className="section about" id="about">
      <div className="section__head">
        <p className="eyebrow">About</p>
      </div>
      <div className="about__grid">
        <m.div
          className="about__portrait"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
        >
          {about.portrait ? (
            <img
              src={about.portrait}
              alt={about.portraitAlt || site.name}
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <p className="about__caption">{site.name}</p>
        </m.div>
        <m.div
          className="about__copy"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, delay: 0.08 }}
        >
          <h2>{about.lead}</h2>
          {about.body.map((p, i) => (
            <p key={`${i}-${p.slice(0, 24)}`}>{p}</p>
          ))}
          {about.note ? <p className="about__note">{about.note}</p> : null}
          {about.timeline && about.timeline.length > 0 ? (
            <div className="about__timeline">
              <p className="eyebrow">Experience</p>
              <ol>
                {about.timeline.map((entry, i) => (
                  <li key={`${entry.period}-${entry.role}-${i}`}>
                    <span className="about__period">{entry.period}</span>
                    <span className="about__role">{entry.role}</span>
                    <span className="about__org">{entry.org}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </m.div>
      </div>
    </section>
  )
}
