import { Link, Navigate, useParams } from 'react-router-dom'
import { Footer } from '../components/Contact'
import { Nav } from '../components/Nav'
import { getProject, projects } from '../content'

export function ProjectPage() {
  const { slug } = useParams()
  const project = slug ? getProject(slug) : undefined

  if (!project) {
    return <Navigate to="/" replace />
  }

  const others = projects.filter((p) => p.id !== project.id)

  return (
    <div className="app">
      <Nav variant="page" />
      <main className="project-page">
        <header className="project-page__hero">
          <div className="project-page__hero-media" aria-hidden>
            <img src={project.image} alt="" />
            <div className="project-page__hero-veil" />
          </div>
          <div className="project-page__hero-content">
            <Link className="project-page__back" to="/#projects">
              ← Projects
            </Link>
            <p className="eyebrow">{project.subtitle}</p>
            <h1>{project.title}</h1>
            <p className="project-page__summary">{project.summary}</p>
            <div className="projects__links">
              {project.links.map((link) => (
                <a
                  key={link.href}
                  className={link.label.toLowerCase().includes('play') ? 'btn btn--primary' : 'btn btn--ghost'}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </header>

        <div className="project-page__body">
          <aside className="project-page__toc">
            <p className="eyebrow">On this page</p>
            <ul>
              {project.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </aside>

          <article className="project-page__article">
            <section className="project-page__intro">
              {project.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <ul className="project-page__highlights">
                {project.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>

            {project.sections.map((section) => (
              <section key={section.id} id={section.id} className="project-page__section">
                <h2>{section.title}</h2>
                {section.quote && <blockquote>{section.quote}</blockquote>}
                {section.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {section.image && (
                  <figure>
                    <img src={section.image} alt={section.imageAlt ?? ''} />
                    {section.imageAlt && <figcaption>{section.imageAlt}</figcaption>}
                  </figure>
                )}
              </section>
            ))}

            {project.gallery.length > 0 && (
              <section className="project-page__gallery" id="gallery">
                <h2>Gallery</h2>
                <div className="project-page__gallery-grid">
                  {project.gallery.map((src) => (
                    <figure key={src} className="project-page__gallery-item">
                      <img src={src} alt={`${project.title} screenshot`} />
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {others.length > 0 && (
              <section className="project-page__more">
                <h2>More projects</h2>
                <div className="projects__grid">
                  {others.map((p) => (
                    <Link key={p.id} className="projects__card" to={`/projects/${p.slug}`}>
                      <img src={p.image} alt="" />
                      <div>
                        <h3>{p.title}</h3>
                        <p>{p.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
