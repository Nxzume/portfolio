import { useCallback, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useContent } from '../content/context'
import { playPianoNote } from '../lib/pianoAudio'
import { isExternalHref, safeHref } from '../lib/urls'
import {
  externalProps,
  firstName,
  focusFor,
  recentRoles,
  socialLinks,
  splitProjects,
} from './data'
import { useScrollSpy } from './hooks'
import { ConceptHead, ConceptSwitcher, ProjectImage, SpotifyPlayer } from './shared'
import './concept-a.css'

const WHITE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
/** Black key that sits to the right of each white key (none after E and B). */
const BLACK_AFTER: Record<number, string> = { 0: 'Cs4', 1: 'Ds4', 3: 'Fs4', 4: 'Gs4', 5: 'As4' }

type Key = {
  note: string
  label: string
  sectionId?: string
  href?: string
}

function playNote(note: string) {
  void playPianoNote(note, 1.5).catch(() => {
    /* autoplay policy — navigation still works silently */
  })
}

function PianoNav({ keys, active }: { keys: Key[]; active: string }) {
  const onKey = useCallback((event: MouseEvent<HTMLElement>, key: Key) => {
    playNote(key.note)
    if (!key.sectionId) return
    const target = document.getElementById(key.sectionId)
    if (!target) return
    event.preventDefault()
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
    history.replaceState(null, '', `#${key.sectionId}`)
  }, [])

  return (
    <nav className="ca-keys" aria-label="Sections — each key is a piano note">
      <div className="ca-keys__board">
        {keys.map((key) => {
          const isActive = key.sectionId === active
          const className = `ca-key${isActive ? ' is-active' : ''}${key.label ? '' : ' is-silent'}`
          const body = (
            <>
              <span className="ca-key__label">{key.label}</span>
              {key.href && isExternalHref(key.href) ? (
                <span className="ca-key__ext" aria-hidden>
                  ↗
                </span>
              ) : null}
            </>
          )
          if (key.sectionId) {
            return (
              <a
                key={key.note}
                className={className}
                href={`#${key.sectionId}`}
                aria-current={isActive ? 'location' : undefined}
                onClick={(e) => onKey(e, key)}
              >
                {body}
              </a>
            )
          }
          if (key.href) {
            return (
              <a
                key={key.note}
                className={className}
                href={key.href}
                {...externalProps(key.href)}
                onClick={(e) => onKey(e, key)}
              >
                {body}
              </a>
            )
          }
          return (
            <button
              key={key.note}
              type="button"
              className={className}
              aria-label={`Play ${key.note}`}
              onClick={(e) => onKey(e, key)}
            >
              {body}
            </button>
          )
        })}
        {keys.map((_key, i) => {
          const black = BLACK_AFTER[i]
          if (!black || i >= keys.length - 1) return null
          return (
            <button
              key={black}
              type="button"
              className="ca-key-black"
              style={{ left: `calc(${((i + 1) / keys.length) * 100}% - var(--black-w) / 2)` }}
              tabIndex={-1}
              aria-hidden
              onClick={() => playNote(black)}
            />
          )
        })}
      </div>
    </nav>
  )
}

export function ConceptA() {
  const content = useContent()
  const { site, hero, about, contact, score, projectsSection } = content
  const compose = focusFor(content, 'compose')
  const azure = focusFor(content, 'azure')
  const levels = focusFor(content, 'levels')
  const { visual, other } = splitProjects(content)
  const social = socialLinks(content)
  const roles = recentRoles(content, 3)

  const navItems: Key[] = [
    { note: WHITE_NOTES[0], label: 'Listen', sectionId: 'listen' },
    { note: WHITE_NOTES[1], label: 'Worlds', sectionId: 'worlds' },
    { note: WHITE_NOTES[2], label: azure?.label ?? 'Day job', sectionId: 'craft' },
    { note: WHITE_NOTES[3], label: 'About', sectionId: 'about' },
    { note: WHITE_NOTES[4], label: 'Contact', sectionId: 'contact' },
  ]
  const linkKeys: Key[] = social.slice(0, 2).map((link, i) => ({
    note: WHITE_NOTES[5 + i],
    label: link.label,
    href: link.href,
  }))
  const keys: Key[] = [...navItems, ...linkKeys]
  for (let i = keys.length; i < WHITE_NOTES.length; i++) {
    keys.push({ note: WHITE_NOTES[i], label: '' })
  }

  const active = useScrollSpy(['top', 'listen', 'worlds', 'craft', 'about', 'contact'], 'top')

  return (
    <div className="concept concept-a">
      <ConceptHead id="a" />
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="ca-header">
        <Link className="ca-brand" to="/concepts/a">
          <span className="ca-brand__name">{site.name}</span>
          <span className="ca-brand__role">Composer · Level designer · Engineer</span>
        </Link>
        <PianoNav keys={keys} active={active} />
      </header>

      <main id="main">
        <section className="ca-overture" id="top">
          <div className="ca-overture__copy">
            <p className="ca-kicker">Composer portfolio</p>
            <h1 className="ca-name">{site.name}</h1>
            <p className="ca-headline">{hero.headline}</p>
            <p className="ca-lede">{site.tagline}</p>
            <div className="ca-cta">
              <a className="btn btn--primary" href="#listen">
                {hero.primaryCta.label}
              </a>
              <a className="btn btn--ghost" href="#worlds">
                {hero.secondaryCta.label}
              </a>
            </div>
            <p className="ca-hint">
              <span aria-hidden>♪</span> The keyboard is the menu. Press a key to play it and travel
              to its section.
            </p>
          </div>
          <figure className="ca-overture__visual" aria-hidden>
            <img src="/images/piano-hero.png" alt="" fetchPriority="high" decoding="async" />
          </figure>
        </section>

        <section className="ca-section ca-listen" id="listen">
          <div className="ca-listen__copy">
            <p className="eyebrow">{score.eyebrow}</p>
            <h2>{score.title}</h2>
            <p className="ca-section__lede">{score.lede}</p>
            {compose ? (
              <div className="ca-pull">
                <p className="ca-pull__title">{compose.headline}</p>
                <p>{compose.body}</p>
              </div>
            ) : null}
          </div>
          <div className="ca-listen__player">
            <SpotifyPlayer height={420} />
          </div>
        </section>

        <section className="ca-section ca-worlds" id="worlds">
          <div className="ca-section__head">
            <p className="eyebrow">{projectsSection.eyebrow}</p>
            <h2>Worlds the music lives in</h2>
            <p className="ca-section__lede">
              {levels ? `${levels.headline}. ` : ''}
              {projectsSection.lede}
            </p>
          </div>
          <ol className="ca-cues">
            {visual.map((project, i) => (
              <li key={project.id} className="ca-cue">
                <Link className="ca-cue__link" to={`/projects/${project.slug}`}>
                  <span className="ca-cue__num" aria-hidden>
                    Cue {String(i + 1).padStart(2, '0')}
                  </span>
                  <ProjectImage className="ca-cue__img" src={project.image} />
                  <span className="ca-cue__body">
                    <span className="ca-cue__sub">{project.subtitle}</span>
                    <span className="ca-cue__title">{project.title}</span>
                    <span className="ca-cue__summary">{project.summary}</span>
                    <span className="ca-cue__open">Open project →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          {other.length ? (
            <ul className="ca-also">
              {other.map((project) => (
                <li key={project.id}>
                  <Link to={`/projects/${project.slug}`}>
                    <span className="ca-also__title">{project.title}</span>
                    <span className="ca-also__sub">{project.subtitle}</span>
                    <span aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {azure ? (
          <section className="ca-section ca-craft" id="craft">
            <div className="ca-craft__panel">
              <div>
                <p className="eyebrow">Day job</p>
                <h2>{azure.headline}</h2>
                <p className="ca-section__lede">{azure.body}</p>
              </div>
              <ol className="ca-roles" aria-label="Recent roles">
                {roles.map((role) => (
                  <li key={`${role.period}-${role.org}`}>
                    <span className="ca-roles__period">{role.period}</span>
                    <span className="ca-roles__role">{role.role}</span>
                    <span className="ca-roles__org">{role.org}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        <section className="ca-section ca-about" id="about">
          <figure className="ca-about__portrait">
            <ProjectImage src={about.portrait} alt={about.portraitAlt || site.name} />
          </figure>
          <div className="ca-about__copy">
            <p className="eyebrow">About</p>
            <h2>Program notes</h2>
            <p className="ca-about__lead">{about.lead}</p>
            {about.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="ca-contact" id="contact">
          <img className="ca-contact__bg" src="/images/piano-detail.png" alt="" aria-hidden loading="lazy" />
          <div className="ca-contact__veil" />
          <div className="ca-contact__inner">
            <p className="eyebrow">{contact.eyebrow}</p>
            <h2>{contact.title}</h2>
            <p className="ca-section__lede">{contact.lede}</p>
            <div className="ca-cta">
              <a className="btn btn--primary" href={safeHref(`mailto:${site.email}`)}>
                {contact.emailButtonText || `Email ${firstName(site.name)}`}
              </a>
              {social.map((link) => (
                <a key={link.label} className="btn btn--ghost" href={link.href} {...externalProps(link.href)}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="ca-footer">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <a href="#top">Back to top ↑</a>
      </footer>

      <ConceptSwitcher current="a" />
    </div>
  )
}
