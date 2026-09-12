import { useContent } from '../content/context'
import type { ContactContent, SiteContent } from '../content/types'

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

function contactActions(contact: ContactContent, site: SiteContent) {
  const actions: { label: string; href: string; style: 'primary' | 'ghost' }[] = [
    {
      label: contact.emailButtonText || `Email ${firstName(site.name)}`,
      href: `mailto:${site.email}`,
      style: 'primary',
    },
  ]

  // The link name is the button label, shown exactly as typed in the admin.
  for (const [key, href] of Object.entries(site.links)) {
    if (href.trim() && key.trim()) actions.push({ label: key.trim(), href, style: 'ghost' })
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
      <a className="footer__top" href="#main">
        Back to top ↑
      </a>
    </footer>
  )
}
