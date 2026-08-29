import { usePortfolioContent } from '../content'

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

export function Contact() {
  const { contact, site } = usePortfolioContent()

  const actions: { label: string; href: string; style: 'primary' | 'ghost' }[] = [
    {
      label: contact.emailButtonText || `Email ${firstName(site.name)}`,
      href: `mailto:${site.email}`,
      style: 'primary',
    },
  ]

  if (site.links.github) {
    actions.push({ label: 'GitHub', href: site.links.github, style: 'ghost' })
  }
  if (site.links.linkedin) {
    actions.push({ label: 'LinkedIn', href: site.links.linkedin, style: 'ghost' })
  }

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
  const { site } = usePortfolioContent()

  return (
    <footer className="footer">
      <p suppressHydrationWarning>
        © {new Date().getFullYear()} {site.name}
      </p>
    </footer>
  )
}
