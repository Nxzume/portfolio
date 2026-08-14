import { site } from '../data/content'

export function Contact() {
  return (
    <section className="section contact" id="contact">
      <div className="section__head">
        <p className="eyebrow">Contact</p>
        <h2>Let’s talk scores, levels, or Azure.</h2>
        <p className="section__lede">
          Reach out for game composition, level design collaboration, or DevOps conversations.
        </p>
      </div>
      <div className="contact__actions">
        <a className="btn btn--primary" href={`mailto:${site.email}`}>
          Email Alexandre
        </a>
        <a className="btn btn--ghost" href={site.links.itch} target="_blank" rel="noreferrer">
          itch.io
        </a>
        <a className="btn btn--ghost" href={site.links.githubLevel} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} {site.name}</p>
      <p>Redesigned portfolio — content migrating from the original site.</p>
    </footer>
  )
}
