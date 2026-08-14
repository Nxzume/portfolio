import { motion } from 'framer-motion'
import { about } from '../content'

export function About() {
  return (
    <section className="section about" id="about">
      <div className="about__grid">
        <motion.div
          className="about__portrait"
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8 }}
        >
          <img src={about.portrait} alt={about.portraitAlt} />
        </motion.div>
        <div className="about__copy">
          <p className="eyebrow">About</p>
          <h2>{about.lead}</h2>
          {about.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {about.note ? <p className="about__note">{about.note}</p> : null}
        </div>
      </div>
    </section>
  )
}
