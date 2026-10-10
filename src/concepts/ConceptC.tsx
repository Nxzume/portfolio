import { Link } from 'react-router-dom'
import { useContent } from '../content/context'
import { safeHref } from '../lib/urls'
import { externalProps, focusFor, recentRoles, socialLinks, splitProjects } from './data'
import { useScrollProgress, useScrollSpy, useStylesheet } from './hooks'
import { ConceptHead, ConceptSwitcher, ProjectImage, SpotifyPlayer } from './shared'
import './concept-c.css'

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&display=swap'

const ROMAN = ['I', 'II', 'III']

export function ConceptC() {
  const content = useContent()
  const { site, about, contact, score } = content
  const compose = focusFor(content, 'compose')
  const levels = focusFor(content, 'levels')
  const azure = focusFor(content, 'azure')
  const { visual, other } = splitProjects(content)
  const social = socialLinks(content)
  const roles = recentRoles(content, 4)

  useStylesheet('concept-c-fonts', FONT_HREF)
  const progress = useScrollProgress()

  const chapters = [
    { id: 'compose', focus: compose },
    { id: 'levels', focus: levels },
    { id: 'azure', focus: azure },
  ].filter((chapter) => chapter.focus != null)

  const active = useScrollSpy(['top', ...chapters.map((c) => c.id), 'coda'], 'top')
  const [firstWord, ...rest] = site.name.split(' ')

  return (
    <div className="concept concept-c">
      <ConceptHead id="c" />
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="cc-bar">
        <Link className="cc-bar__name" to="/concepts/c">
          {site.name}
        </Link>
        <nav className="cc-bar__nav" aria-label="Primary">
          {chapters.map((chapter, i) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className={active === chapter.id ? 'is-active' : undefined}
              aria-current={active === chapter.id ? 'location' : undefined}
            >
              <span aria-hidden>{ROMAN[i]}</span> {chapter.focus!.label}
            </a>
          ))}
          <a href="#coda" className={active === 'coda' ? 'is-active' : undefined}>
            Contact
          </a>
        </nav>
        <span className="cc-bar__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />
      </header>

      <main id="main">
        <section className="cc-open" id="top">
          <h1 className="cc-name">
            <span>{firstWord}</span>
            <span>{rest.join(' ')}</span>
          </h1>
          <p className="cc-tagline">{site.tagline}</p>

          <ol className="cc-toc" aria-label="Contents">
            {chapters.map((chapter, i) => (
              <li key={chapter.id}>
                <a href={`#${chapter.id}`}>
                  <span className="cc-toc__num">{ROMAN[i]}</span>
                  <span className="cc-toc__label">{chapter.focus!.label}</span>
                  <span className="cc-toc__line">{chapter.focus!.headline}</span>
                  <span className="cc-toc__arrow" aria-hidden>
                    ↓
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        {compose ? (
          <section className="cc-chapter" id="compose">
            <div className="cc-chapter__rail">
              <span className="cc-chapter__num">I</span>
              <span className="cc-chapter__label">{compose.label}</span>
            </div>
            <div className="cc-chapter__main">
              <h2>{compose.headline}</h2>
              <p className="cc-lead">{compose.body}</p>
              <div className="cc-listen">
                <p className="cc-caption">
                  {score.title} — {score.lede}
                </p>
                <SpotifyPlayer height={352} />
              </div>
            </div>
          </section>
        ) : null}

        {levels ? (
          <section className="cc-chapter" id="levels">
            <div className="cc-chapter__rail">
              <span className="cc-chapter__num">II</span>
              <span className="cc-chapter__label">{levels.label}</span>
            </div>
            <div className="cc-chapter__main">
              <h2>{levels.headline}</h2>
              <p className="cc-lead">{levels.body}</p>
              <ul className="cc-works">
                {visual.map((project) => (
                  <li key={project.id}>
                    <Link to={`/projects/${project.slug}`} className="cc-work">
                      <ProjectImage className="cc-work__img" src={project.image} />
                      <span className="cc-work__sub">{project.subtitle}</span>
                      <span className="cc-work__title">{project.title}</span>
                      <span className="cc-work__summary">{project.summary}</span>
                      <span className="cc-work__go">Read the case study →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {azure ? (
          <section className="cc-chapter" id="azure">
            <div className="cc-chapter__rail">
              <span className="cc-chapter__num">III</span>
              <span className="cc-chapter__label">{azure.label}</span>
            </div>
            <div className="cc-chapter__main">
              <h2>{azure.headline}</h2>
              <p className="cc-lead">{azure.body}</p>
              <ol className="cc-roles">
                {roles.map((role) => (
                  <li key={`${role.period}-${role.org}`}>
                    <span className="cc-roles__period">{role.period}</span>
                    <span className="cc-roles__role">{role.role}</span>
                    <span className="cc-roles__org">{role.org}</span>
                  </li>
                ))}
              </ol>
              {other.map((project) => (
                <p key={project.id} className="cc-also">
                  <span className="cc-also__tag">{project.subtitle}</span>
                  <Link to={`/projects/${project.slug}`}>{project.title}</Link> — {project.summary}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section className="cc-coda" id="coda">
          <div className="cc-coda__who">
            <figure className="cc-coda__portrait">
              <ProjectImage src={about.portrait} alt={about.portraitAlt || site.name} />
            </figure>
            <p className="cc-coda__lead">{about.lead}</p>
          </div>

          <div className="cc-coda__contact">
            <p className="cc-eyebrow">{contact.eyebrow}</p>
            <h2>{contact.title}</h2>
            <p className="cc-lead">{contact.lede}</p>
            <a className="cc-email" href={safeHref(`mailto:${site.email}`)}>
              {site.email}
            </a>
            <p className="cc-social">
              {social.map((link) => (
                <a key={link.label} href={link.href} {...externalProps(link.href)}>
                  {link.label} ↗
                </a>
              ))}
            </p>
          </div>
        </section>
      </main>

      <footer className="cc-footer">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <a href="#top">Back to top ↑</a>
      </footer>

      <ConceptSwitcher current="c" />
    </div>
  )
}
