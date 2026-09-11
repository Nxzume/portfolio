import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useContent } from '../content/context'

/** Projects as a numbered index — rows, not cards. */
export function Projects() {
  const { projects, projectsSection } = useContent()
  return (
    <section className="section projects" id="projects">
      <div className="section__head">
        <p className="eyebrow">{projectsSection.eyebrow}</p>
        <h2>{projectsSection.title}</h2>
        <p className="section__lede">{projectsSection.lede}</p>
      </div>

      <ol className="projects__index">
        {projects.map((p, i) => (
          <m.li
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.4 }}
          >
            <Link className="projects__row" to={`/projects/${p.slug}`}>
              <span className="projects__row-num" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="projects__row-main">
                <span className="projects__row-title">{p.title}</span>
                <span className="projects__row-sub">{p.subtitle}</span>
                {p.summary ? <span className="projects__row-summary">{p.summary}</span> : null}
              </span>
              {p.image ? (
                <span className="projects__row-thumb" aria-hidden>
                  <img src={p.image} alt="" loading="lazy" decoding="async" />
                </span>
              ) : null}
              <span className="projects__row-arrow" aria-hidden>
                →
              </span>
            </Link>
          </m.li>
        ))}
      </ol>
    </section>
  )
}
