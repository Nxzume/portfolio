import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { projects } from '../data/content'

export function Projects() {
  const [activeId, setActiveId] = useState(projects[0].id)
  const active = projects.find((p) => p.id === activeId) ?? projects[0]
  const [galleryIndex, setGalleryIndex] = useState(0)

  const select = (id: string) => {
    setActiveId(id)
    setGalleryIndex(0)
  }

  const gallery = [active.image, ...active.gallery.filter((g) => g !== active.image)]

  return (
    <section className="section projects" id="projects">
      <div className="section__head">
        <p className="eyebrow">Level design</p>
        <h2>Personal projects</h2>
        <p className="section__lede">
          Existing Unity work from the original portfolio — content kept for now, presentation rebuilt.
        </p>
      </div>

      <div className="projects__layout">
        <div className="projects__chooser" role="tablist" aria-label="Projects">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === activeId}
              className={`projects__chip ${p.id === activeId ? 'is-active' : ''}`}
              onClick={() => select(p.id)}
            >
              <span>{p.title}</span>
              <small>{p.subtitle}</small>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={active.id}
            className="projects__detail"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <div className="projects__visual">
              <img src={gallery[galleryIndex]} alt={`${active.title} screenshot`} />
              {gallery.length > 1 && (
                <div className="projects__thumbs">
                  {gallery.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className={i === galleryIndex ? 'is-active' : ''}
                      onClick={() => setGalleryIndex(i)}
                      aria-label={`Show image ${i + 1}`}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="projects__copy">
              <h3>{active.title}</h3>
              <p>{active.summary}</p>
              <ul>
                {active.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <div className="projects__links">
                {active.links.map((link) => (
                  <a key={link.href} className="btn btn--ghost" href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  )
}
