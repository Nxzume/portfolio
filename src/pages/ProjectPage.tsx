import { useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Footer } from '../components/Contact'
import { Nav } from '../components/Nav'
import { PageHead } from '../components/PageHead'
import { ProjectCard } from '../components/ProjectCard'
import { usePortfolioContent } from '../content'
import { useDialog } from '../hooks/useDialog'
import { projectMeta } from '../lib/meta'
import { NotFound } from './NotFound'

/** Editors often type "google.com" or an in-page "#anchor" instead of a full URL. */
function isExternal(href: string) {
  return /^(https?:)?\/\//i.test(href) || /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(href)
}

function normalizeHref(href: string) {
  const value = href.trim()
  if (!value) return '#'
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(value)) return value
  if (isExternal(value)) return `https://${value}`
  return value
}

type Lightbox = { src: string; alt: string }

export function ProjectPage() {
  const { getProject, hero, projects, site } = usePortfolioContent()
  const { slug } = useParams()
  const project = slug ? getProject(slug) : undefined
  const [lightbox, setLightbox] = useState<Lightbox | null>(null)
  const lightboxTitleId = useId()
  const lightboxRef = useDialog<HTMLDivElement>(Boolean(lightbox), () => setLightbox(null))

  if (!project) {
    return <NotFound />
  }

  const others = projects.filter((p) => p.id !== project.id)

  return (
    <div className="app">
      <PageHead meta={projectMeta(site, hero, project)} />
      <Nav variant="page" />
      <main id="main" className="project-page">
        <header className="project-page__hero">
          <div className="project-page__hero-media" aria-hidden>
            {project.image ? <img src={project.image} alt="" decoding="async" /> : null}
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
              {project.links.map((link, i) => {
                const external = isExternal(link.href)
                return (
                  <a
                    key={`${i}-${link.href}`}
                    className={link.label.toLowerCase().includes('play') ? 'btn btn--primary' : 'btn btn--ghost'}
                    href={normalizeHref(link.href)}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noreferrer' : undefined}
                  >
                    {link.label}
                  </a>
                )
              })}
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
                      onClick={() =>
                        setLightbox({
                          src: section.image!,
                          alt: section.imageAlt || `${project.title} — ${section.title}`,
                        })
                      }
                      aria-label={`View larger: ${section.imageAlt || section.title}`}
                    >
                      <img
                        src={section.image}
                        alt={section.imageAlt ?? ''}
                        loading="lazy"
                        decoding="async"
                      />
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
                  {project.gallery.map((src, i) => (
                    <button
                      key={`${i}-${src}`}
                      type="button"
                      className="project-page__gallery-item"
                      onClick={() =>
                        setLightbox({ src, alt: `${project.title} screenshot ${i + 1}` })
                      }
                      aria-label={`View larger image from ${project.title}`}
                    >
                      <img
                        src={src}
                        alt={`${project.title} screenshot ${i + 1}`}
                        loading="lazy"
                        decoding="async"
                      />
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
                    <ProjectCard key={p.slug} project={p} />
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
          ref={lightboxRef}
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={lightboxTitleId}
          onClick={() => setLightbox(null)}
        >
          <p id={lightboxTitleId} className="visually-hidden">
            {lightbox.alt}
          </p>
          <button
            type="button"
            className="lightbox__close"
            aria-label="Close"
            onClick={() => setLightbox(null)}
          >
            Close
          </button>
          <img
            className="lightbox__img"
            src={lightbox.src}
            alt={lightbox.alt}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  )
}
