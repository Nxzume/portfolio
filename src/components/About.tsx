import { motion } from 'framer-motion'
import { about, site } from '../content'

export function About() {
  return (
    <section className="section about" id="about">
      <div className="about__grid">
        <motion.div
          className="about__portrait"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
        >
          <img src={about.portrait} alt={about.portraitAlt || site.name} />
        </motion.div>
        <motion.div
          className="about__copy"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, delay: 0.08 }}
        >
          <h2>{about.lead}</h2>
          {about.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          {about.note ? <p className="about__note">{about.note}</p> : null}
        </motion.div>
      </div>
    </section>
  )
}
