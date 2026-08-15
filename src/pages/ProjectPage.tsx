import { useEffect, useId, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Footer } from '../components/Contact'
import { Nav } from '../components/Nav'
import { getProject, projects } from '../content'

export function ProjectPage() {
  const { slug } = useParams()
  const project = slug ? getProject(slug) : undefined
  const [lightbox, setLightbox] = useState<string | null>(null)
  const lightboxTitleId = useId()

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightbox])

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
                  key={link.href + link.label}
                  className={link.label.toLowerCase().includes('play') ? 'btn btn--primary' : 'btn btn--ghost'}
                  href={link.href.startsWith('http') ? link.href : `https://${link.href}`}
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
          {project.sections.length > 0 || project.gallery.length > 0 ? (
            <aside className="project-page__toc">
              <p className="eyebrow">On this page</p>
              <ul>
                {project.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
                {project.gallery.length > 0 && (
                  <li>
                    <a href="#gallery">Gallery</a>
                  </li>
                )}
              </ul>
            </aside>
          ) : null}

          <article className="project-page__article">
            <section className="project-page__intro">
              {project.intro.map((p, i) => (
                <p key={`${i}-${p.slice(0, 24)}`}>{p}</p>
              ))}
              {project.highlights.length > 0 ? (
                <ul className="project-page__highlights">
                  {project.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            {project.sections.map((section) => (
              <section key={section.id} id={section.id} className="project-page__section">
                <h2>{section.title}</h2>
                {section.quote && <blockquote>{section.quote}</blockquote>}
                {section.paragraphs.map((p, i) => (
                  <p key={`${section.id}-${i}`}>{p}</p>
                ))}
                {section.image && (
                  <figure>
                    <button
                      type="button"
                      className="project-page__zoom"
                      onClick={() => setLightbox(section.image!)}
                      aria-label={`View larger: ${section.imageAlt || section.title}`}
                    >
                      <img src={section.image} alt={section.imageAlt ?? ''} />
                    </button>
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
                    <button
                      key={src}
                      type="button"
                      className="project-page__gallery-item"
                      onClick={() => setLightbox(src)}
                      aria-label={`View larger image from ${project.title}`}
                    >
                      <img src={src} alt={`${project.title} screenshot`} />
                    </button>
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
                      <div className="projects__card-body">
                        <h3>{p.title}</h3>
                        <p className="projects__card-sub">{p.subtitle}</p>
                        <span className="projects__card-cta">Read more →</span>
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

      {lightbox ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={lightboxTitleId}
          onClick={() => setLightbox(null)}
        >
          <p id={lightboxTitleId} className="visually-hidden">
            Enlarged image
          </p>
          <button type="button" className="lightbox__close" aria-label="Close">
            Close
          </button>
          <img
            className="lightbox__img"
            src={lightbox}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  )
}
