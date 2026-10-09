import { m, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { SectionReveal } from './SectionReveal'
import { useContent } from '../content/context'
import { useMotionBudget, type MotionBudget } from '../hooks/useMotionBudget'
import { easeOutExpo, gpuTransformTemplate } from '../lib/motion'

function ProjectRow({
  project,
  index,
  budget,
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
  budget: MotionBudget
}) {
  const ref = useRef<HTMLLIElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  })
  const slide = budget.projectX
  const x = useTransform(scrollYProgress, [0, 1], [index % 2 === 0 ? -slide : slide, 0])
  const opacity = useTransform(scrollYProgress, [0, 0.55], [0.15, 1])
  const mediaScale = useTransform(scrollYProgress, [0, 1], budget.projectMediaScale)

  return (
    <m.li
      ref={ref}
      className="gpu-scroll"
      style={{ x, opacity }}
      transformTemplate={gpuTransformTemplate}
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
          <m.span
            className="projects__feature-cta"
            whileHover={budget.compact ? undefined : { x: 6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            Open project →
          </m.span>
        </span>
        {project.image ? (
          <span className="projects__feature-media" aria-hidden>
            <m.img
              className="gpu-media"
              src={project.image}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ scale: mediaScale }}
              transformTemplate={gpuTransformTemplate}
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
  const budget = useMotionBudget()
  return (
    <section className="section projects" id="projects">
      <SectionReveal>
        <p className="eyebrow">{projectsSection.eyebrow}</p>
        <h2>{projectsSection.title}</h2>
        <p className="section__lede">{projectsSection.lede}</p>
      </SectionReveal>

      <ol className="projects__index">
        {projects.map((p, i) => (
          <ProjectRow key={p.id} project={p} index={i} budget={budget} />
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
