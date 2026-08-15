import { Link } from 'react-router-dom'
import { Footer } from '../components/Contact'
import { Nav } from '../components/Nav'
import { PageHead } from '../components/PageHead'
import { ProjectCard } from '../components/ProjectCard'
import { projects } from '../content'
import { notFoundMeta } from '../lib/meta'

export function NotFound() {
  return (
    <div className="app">
      <PageHead meta={notFoundMeta()} />
      <Nav variant="page" />
      <main id="main" className="notfound">
        <p className="eyebrow">404</p>
        <h1>That page moved or never existed</h1>
        <p className="notfound__lede">
          The link may be out of date. Head back to the homepage, or pick up a project below.
        </p>
        <Link className="btn btn--primary" to="/">
          Back to homepage
        </Link>

        {projects.length > 0 && (
          <section className="notfound__projects">
            <h2>Projects</h2>
            <div className="projects__grid">
              {projects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
