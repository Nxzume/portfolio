import { m, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { SectionReveal } from './SectionReveal'
import { useContent } from '../content/context'
import type { ContactContent, SiteContent } from '../content/types'
import { useMotionBudget } from '../hooks/useMotionBudget'
import { easeOutExpo, gpuTransformTemplate } from '../lib/motion'
import { isExternalHref, safeHref } from '../lib/urls'

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

function contactActions(contact: ContactContent, site: SiteContent) {
  const actions: { label: string; href: string; style: 'primary' | 'ghost' }[] = [
    {
      label: contact.emailButtonText || `Email ${firstName(site.name)}`,
      href: safeHref(`mailto:${site.email}`),
      style: 'primary',
    },
  ]

  for (const [key, href] of Object.entries(site.links)) {
    if (href.trim() && key.trim()) actions.push({ label: key.trim(), href: safeHref(href), style: 'ghost' })
  }
  return actions
}

export function Contact() {
  const { contact, site } = useContent()
  const actions = contactActions(contact, site)
  const budget = useMotionBudget()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const bgScale = useTransform(scrollYProgress, [0, 1], budget.contactScale)
  const bgY = useTransform(scrollYProgress, [0, 1], budget.contactY)

  return (
    <section className="section contact" id="contact" ref={ref}>
      <div className="contact__panel">
        <m.img
          className="contact__bg gpu-media"
          src="/images/piano-detail.png"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          style={{ scale: bgScale, y: bgY }}
          transformTemplate={gpuTransformTemplate}
        />
        <div className="contact__veil" />
        <div className="contact__inner">
          <SectionReveal className="contact__head">
            <p className="eyebrow">{contact.eyebrow}</p>
            <h2>{contact.title}</h2>
            <p className="section__lede">{contact.lede}</p>
          </SectionReveal>
          <m.div
            className="contact__actions"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.65, delay: 0.1, ease: easeOutExpo }}
          >
            {actions.map((action, i) => (
              <m.a
                key={action.href + action.label}
                className={`btn ${action.style === 'primary' ? 'btn--primary' : 'btn--ghost'}`}
                href={action.href}
                target={isExternalHref(action.href) ? '_blank' : undefined}
                rel={isExternalHref(action.href) ? 'noreferrer' : undefined}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12 + i * 0.06, duration: 0.45 }}
                whileHover={budget.compact ? undefined : { y: -3, scale: 1.02 }}
              >
                {action.label}
              </m.a>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  const { site } = useContent()
  return (
    <footer className="footer">
      <p suppressHydrationWarning>
        © {new Date().getFullYear()} {site.name}
      </p>
      <a className="footer__top" href="#main">
        Back to top ↑
      </a>
    </footer>
  )
}
