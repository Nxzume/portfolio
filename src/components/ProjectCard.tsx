import { Link } from 'react-router-dom'
import type { Project } from '../content/types'

type Props = {
  project: Project
  /** The homepage card shows the summary; the "More projects" list stays compact. */
  showSummary?: boolean
  imageLoading?: 'eager' | 'lazy'
}

export function ProjectCard({ project, showSummary = false, imageLoading = 'lazy' }: Props) {
  return (
    <Link className="projects__card" to={`/projects/${project.slug}`}>
      {project.image ? (
        <img src={project.image} alt="" loading={imageLoading} decoding="async" />
      ) : (
        <div className="projects__card-noimg" />
      )}
      <div className="projects__card-body">
        <h3>{project.title}</h3>
        <p className="projects__card-sub">{project.subtitle}</p>
        {showSummary ? <p className="projects__card-summary">{project.summary}</p> : null}
        <span className="projects__card-cta">Read more →</span>
      </div>
    </Link>
  )
}
