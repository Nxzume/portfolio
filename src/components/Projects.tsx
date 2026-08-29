import { m } from 'framer-motion'
import { usePortfolioContent } from '../content'
import { ProjectCard } from './ProjectCard'

export function Projects() {
  const { projects, projectsSection } = usePortfolioContent()

  return (
    <section className="section projects" id="projects">
      <div className="section__head">
        <p className="eyebrow">{projectsSection.eyebrow}</p>
        <h2>{projectsSection.title}</h2>
        <p className="section__lede">{projectsSection.lede}</p>
      </div>

      <div className="projects__grid">
        {projects.map((p, i) => (
          <m.div
            key={p.id}
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: Math.min(i, 8) * 0.06, duration: 0.45 }}
          >
            <ProjectCard project={p} showSummary />
          </m.div>
        ))}
      </div>
    </section>
  )
}
