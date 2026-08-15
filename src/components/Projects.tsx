import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { projects, projectsSection } from '../content'

export function Projects() {
  return (
    <section className="section projects" id="projects">
      <div className="section__head">
        <p className="eyebrow">{projectsSection.eyebrow}</p>
        <h2>{projectsSection.title}</h2>
        <p className="section__lede">{projectsSection.lede}</p>
      </div>

      <div className="projects__grid">
        {projects.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: Math.min(i, 8) * 0.06, duration: 0.45 }}
          >
            <Link className="projects__card" to={`/projects/${p.slug}`}>
              {p.image ? <img src={p.image} alt="" /> : <div className="projects__card-noimg" />}
              <div className="projects__card-body">
                <h3>{p.title}</h3>
                <p className="projects__card-sub">{p.subtitle}</p>
                <p className="projects__card-summary">{p.summary}</p>
                <span className="projects__card-cta">Read more →</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
