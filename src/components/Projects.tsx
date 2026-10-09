import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { SectionReveal } from './SectionReveal'
import { useContent } from '../content/context'
import { easeOutExpo } from '../lib/motion'

function ProjectRow({
  project,
  index,
}: {
  project: {
    id: string
    slug: string
    title: string
    subtitle: string
    summary: string
    image: string
  }
  index: number
}) {
  return (
    <m.li
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.65, delay: Math.min(index, 4) * 0.06, ease: easeOutExpo }}
    >
      <Link className="projects__feature" to={`/projects/${project.slug}`}>
        <span className="projects__feature-index" aria-hidden>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="projects__feature-copy">
          <span className="projects__feature-sub">{project.subtitle}</span>
          <span className="projects__feature-title">{project.title}</span>
          {project.summary ? (
            <span className="projects__feature-summary">{project.summary}</span>
          ) : null}
          <span className="projects__feature-cta">Open project →</span>
        </span>
        {project.image ? (
          <span className="projects__feature-media" aria-hidden>
            <img
              src={project.image}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </span>
        ) : (
          <span className="projects__feature-media projects__feature-media--empty" aria-hidden />
        )}
      </Link>
    </m.li>
  )
}

export function Projects() {
  const { projects, projectsSection } = useContent()
  return (
    <section className="section projects" id="projects">
      <SectionReveal>
        <p className="eyebrow">{projectsSection.eyebrow}</p>
        <h2>{projectsSection.title}</h2>
        <p className="section__lede">{projectsSection.lede}</p>
      </SectionReveal>

      <ol className="projects__index">
        {projects.map((p, i) => (
          <ProjectRow key={p.id} project={p} index={i} />
        ))}
      </ol>

      <m.div
        className="projects__rail"
        aria-hidden
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 1.1, ease: easeOutExpo }}
      />
    </section>
  )
}
