import { contact, site } from '../content'

export function Contact() {
  return (
    <section className="section contact" id="contact">
      <div className="section__head">
        <p className="eyebrow">{contact.eyebrow}</p>
        <h2>{contact.title}</h2>
        <p className="section__lede">{contact.lede}</p>
      </div>
      <div className="contact__actions">
        {contact.actions.map((action) => (
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
      <p>Edit site copy in the <code>content/</code> folder — no React changes needed.</p>
    </footer>
  )
}
