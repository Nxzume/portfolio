import { contact, site } from '../content'

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

function contactActions() {
  const actions: { label: string; href: string; style: 'primary' | 'ghost' }[] = [
    {
      label: contact.emailButtonText || `Email ${firstName(site.name)}`,
      href: `mailto:${site.email}`,
      style: 'primary',
    },
  ]

  if (site.links.itch) {
    actions.push({ label: 'itch.io', href: site.links.itch, style: 'ghost' })
  }
  if (site.links.githubLevel) {
    actions.push({ label: 'GitHub', href: site.links.githubLevel, style: 'ghost' })
  } else if (site.links.githubArena) {
    actions.push({ label: 'GitHub', href: site.links.githubArena, style: 'ghost' })
  }

  return actions
}

export function Contact() {
  const actions = contactActions()

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
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} {site.name}
      </p>
    </footer>
  )
}
