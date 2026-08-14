import { motion } from 'framer-motion'
import { about } from '../data/content'

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
          <img src="/images/portrait.png" alt="Alexandre Guichet" />
        </motion.div>
        <div className="about__copy">
          <p className="eyebrow">About</p>
          <h2>{about.lead}</h2>
          {about.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="about__note">
            Earlier copy mentioned UBC studies and a Bosch internship with ML feature-selection work.
            That history remains part of the story; Azure DevOps and game composition are the forward focus.
          </p>
        </div>
      </div>
    </section>
  )
}
