import { useContent } from '../content/context'
import type { ContactContent, SiteContent } from '../content/types'

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

const KNOWN_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  itch: 'itch.io',
  youtube: 'YouTube',
  bandcamp: 'Bandcamp',
  soundcloud: 'SoundCloud',
  twitter: 'Twitter',
}

/** The link name becomes the button label: "itch" → "itch.io", "githubArena" → "Github Arena". */
export function linkLabel(key: string) {
  const known = KNOWN_LABELS[key.toLowerCase()]
  if (known) return known
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function contactActions(contact: ContactContent, site: SiteContent) {
  const actions: { label: string; href: string; style: 'primary' | 'ghost' }[] = [
    {
      label: contact.emailButtonText || `Email ${firstName(site.name)}`,
      href: `mailto:${site.email}`,
      style: 'primary',
    },
  ]

  for (const [key, href] of Object.entries(site.links)) {
    if (href.trim()) actions.push({ label: linkLabel(key), href, style: 'ghost' })
  }
  return actions
}

export function Contact() {
  const { contact, site } = useContent()
  const actions = contactActions(contact, site)

  return (
    <section className="section contact" id="contact">
      <div className="section__head">
        <p className="eyebrow">{contact.eyebrow}</p>
        <h2>{contact.title}</h2>
        <p className="section__lede">{contact.lede}</p>
      </div>
      <div className="contact__actions">
        {actions.map((action) => (
          <a
            key={action.href + action.label}
            className={`btn ${action.style === 'primary' ? 'btn--primary' : 'btn--ghost'}`}
            href={action.href}
            target={action.href.startsWith('http') ? '_blank' : undefined}
            rel={action.href.startsWith('http') ? 'noreferrer' : undefined}
          >
            {action.label}
          </a>
        ))}
      </div>
    </section>
  )
}

export function Footer() {
  const { site } = useContent()
  return (
    <footer className="footer">
      {/* Baked at build time, refreshed on hydration — they differ over New Year. */}
      <p suppressHydrationWarning>
        © {new Date().getFullYear()} {site.name}
      </p>
    </footer>
  )
}
