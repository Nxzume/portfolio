import { Link } from 'react-router-dom'
import { useContent } from '../content/context'
import type { Project } from '../content/types'
import { safeHref } from '../lib/urls'
import {
  externalProps,
  firstName,
  focusFor,
  projectSection,
  recentRoles,
  sentences,
  socialLinks,
  splitProjects,
} from './data'
import { useScrollSpy } from './hooks'
import { ConceptHead, ConceptSwitcher, ProjectImage, SpotifyPlayer } from './shared'
import './concept-b.css'

const NAV = [
  { id: 'levels', label: 'Levels' },
  { id: 'anatomy', label: 'Case study' },
  { id: 'soundtrack', label: 'Soundtrack' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

function ProjectTile({ project, index, size }: { project: Project; index: number; size: 'lead' | 'side' }) {
  const external = project.links[0]
  return (
    <article className={`cb-tile cb-tile--${size}`}>
      <Link className="cb-tile__cover" to={`/projects/${project.slug}`} aria-label={`${project.title} case study`}>
        <ProjectImage className="cb-tile__img" src={project.image} eager={size === 'lead'} />
      </Link>
      <div className="cb-tile__body">
        <p className="cb-tile__meta">
          <span className="cb-tile__num">{String(index + 1).padStart(2, '0')}</span>
          {project.subtitle}
        </p>
        <h3 className="cb-tile__title">
          <Link to={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        <p className="cb-tile__summary">{project.summary}</p>
        {size === 'lead' && project.highlights.length ? (
          <ul className="cb-chips">
            {project.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <div className="cb-tile__actions">
          <Link className="cb-btn cb-btn--solid" to={`/projects/${project.slug}`}>
            Case study →
          </Link>
          {size === 'lead' && external ? (
            <a className="cb-btn" href={safeHref(external.href)} {...externalProps(safeHref(external.href))}>
              {external.label} ↗
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function ToolTile({ project, index }: { project: Project; index: number }) {
  return (
    <article className="cb-tile cb-tile--tool">
      <div className="cb-tile__body">
        <p className="cb-tile__meta">
          <span className="cb-tile__num">{String(index + 1).padStart(2, '0')}</span>
          {project.subtitle}
        </p>
        <h3 className="cb-tile__title">
          <Link to={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        <ul className="cb-ticks">
          {project.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Link className="cb-btn" to={`/projects/${project.slug}`}>
          Read the write-up →
        </Link>
      </div>
    </article>
  )
}

export function ConceptB() {
  const content = useContent()
  const { site, about, contact, score, projects } = content
  const levels = focusFor(content, 'levels')
  const compose = focusFor(content, 'compose')
  const azure = focusFor(content, 'azure')
  const { visual, other } = splitProjects(content)
  const social = socialLinks(content)
  const roles = recentRoles(content, 5)

  const featured = visual.reduce<Project | undefined>(
    (best, project) => (!best || project.sections.length > best.sections.length ? project : best),
    undefined,
  )
  const goals = featured ? projectSection(featured, 'goals') : undefined
  const challenge = featured ? projectSection(featured, 'challenge') : undefined
  const retro = featured ? projectSection(featured, 'retrospection') : undefined
  const history = featured ? projectSection(featured, 'history') : undefined
  const notes = [goals, challenge, retro].filter((section) => section != null)
  const steps = featured ? sentences(featured.intro.at(-1) ?? '') : []
  const stepList = steps.slice(0, 3)
  const stepNote = steps[3]

  const active = useScrollSpy(NAV.map((item) => item.id), 'levels')

  return (
    <div className="concept concept-b">
      <ConceptHead id="b" />
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <aside className="cb-rail">
        <Link className="cb-rail__brand" to="/concepts/b">
          <span className="cb-rail__name">{site.name}</span>
          <span className="cb-rail__role">
            {[levels?.label, compose?.label, azure?.label].filter(Boolean).join(' / ')}
          </span>
        </Link>
        <nav className="cb-rail__nav" aria-label="Primary">
          <ol>
            {NAV.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={active === item.id ? 'is-active' : undefined}
                  aria-current={active === item.id ? 'location' : undefined}
                >
                  <span className="cb-rail__idx">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="cb-rail__foot">
          <a href={safeHref(`mailto:${site.email}`)}>{site.email}</a>
          <div>
            {social.map((link) => (
              <a key={link.label} href={link.href} {...externalProps(link.href)}>
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      </aside>

      <main id="main" className="cb-main">
        <section className="cb-intro" id="levels">
          <p className="cb-eyebrow">{content.projectsSection.eyebrow}</p>
          <h1>{levels?.headline ?? site.tagline}</h1>
          <p className="cb-intro__lede">{levels?.body ?? site.tagline}</p>
          <p className="cb-intro__meta">
            <span>{projects.length} projects</span>
            <span>{visual.length} playable / visual</span>
            <span>{other.length} open-source</span>
          </p>
        </section>

        <div className="cb-grid">
          {visual[0] ? <ProjectTile project={visual[0]} index={0} size="lead" /> : null}
          {visual.slice(1).map((project, i) => (
            <ProjectTile key={project.id} project={project} index={i + 1} size="side" />
          ))}
          {other.map((project, i) => (
            <ToolTile key={project.id} project={project} index={visual.length + i} />
          ))}

          {compose ? (
            <a className="cb-link-tile cb-link-tile--music" href="#soundtrack">
              <span className="cb-tile__meta">{compose.label}</span>
              <strong>{compose.headline}</strong>
              <span className="cb-link-tile__go">Hear the score ↓</span>
            </a>
          ) : null}
          {azure ? (
            <a className="cb-link-tile" href="#engineering">
              <span className="cb-tile__meta">{azure.label}</span>
              <strong>{azure.headline}</strong>
              <span className="cb-link-tile__go">Day job ↓</span>
            </a>
          ) : null}
          <a className="cb-link-tile cb-link-tile--cta" href="#contact">
            <span className="cb-tile__meta">{contact.eyebrow}</span>
            <strong>{contact.title}</strong>
            <span className="cb-link-tile__go">Get in touch ↓</span>
          </a>
        </div>

        {featured ? (
          <section className="cb-anatomy" id="anatomy">
            <div className="cb-section-head">
              <p className="cb-eyebrow">Case study · {featured.subtitle}</p>
              <h2>Inside {featured.title}</h2>
            </div>

            <div className="cb-anatomy__top">
              <div className="cb-teach">
                <h3>How it teaches</h3>
                <ol>
                  {stepList.map((step, i) => (
                    <li key={step}>
                      <span className="cb-teach__num">L{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                {stepNote ? <p className="cb-teach__note">{stepNote}.</p> : null}
                {history?.quote ? <blockquote className="cb-quote">{history.quote}</blockquote> : null}
              </div>
              <div className="cb-shots">
                {featured.gallery.slice(0, 3).map((src, i) => (
                  <figure key={src} className={`cb-shot cb-shot--${i}`}>
                    <ProjectImage src={src} />
                  </figure>
                ))}
              </div>
            </div>

            <div className="cb-notes">
              {notes.map((section) => (
                <article key={section.id} className="cb-note">
                  <p className="cb-note__tag">{section.title}</p>
                  <p>{section.paragraphs[0]}</p>
                </article>
              ))}
            </div>
            <Link className="cb-btn cb-btn--solid" to={`/projects/${featured.slug}`}>
              Read the full {featured.title} write-up →
            </Link>
          </section>
        ) : null}

        <section className="cb-band cb-soundtrack" id="soundtrack">
          <div className="cb-soundtrack__copy">
            <p className="cb-eyebrow">{score.eyebrow}</p>
            <h2>{score.title}</h2>
            <p>{score.lede}</p>
            {compose ? <p className="cb-dim">{compose.body}</p> : null}
          </div>
          <SpotifyPlayer height={352} />
        </section>

        <section className="cb-band cb-engineering" id="engineering">
          <div className="cb-engineering__copy">
            <p className="cb-eyebrow">Day job</p>
            <h2>{azure?.headline ?? 'Engineering'}</h2>
            <p>{azure?.body}</p>
          </div>
          <ol className="cb-roles">
            {roles.map((role) => (
              <li key={`${role.period}-${role.org}`}>
                <span>{role.period}</span>
                <strong>{role.role}</strong>
                <em>{role.org}</em>
              </li>
            ))}
          </ol>
        </section>

        <section className="cb-band cb-about" id="about">
          <figure className="cb-about__portrait">
            <ProjectImage src={about.portrait} alt={about.portraitAlt || site.name} />
          </figure>
          <div>
            <p className="cb-eyebrow">About</p>
            <h2>{about.lead}</h2>
            <p className="cb-dim">{about.body[0]}</p>
          </div>
        </section>

        <section className="cb-contact" id="contact">
          <p className="cb-eyebrow">{contact.eyebrow}</p>
          <h2>{contact.title}</h2>
          <p>{contact.lede}</p>
          <div className="cb-tile__actions">
            <a className="cb-btn cb-btn--solid" href={safeHref(`mailto:${site.email}`)}>
              {contact.emailButtonText || `Email ${firstName(site.name)}`}
            </a>
            {social.map((link) => (
              <a key={link.label} className="cb-btn" href={link.href} {...externalProps(link.href)}>
                {link.label} ↗
              </a>
            ))}
          </div>
        </section>

        <footer className="cb-footer">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <a href="#levels">Back to top ↑</a>
        </footer>
      </main>

      <ConceptSwitcher current="b" />
    </div>
  )
}
