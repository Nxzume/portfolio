import { m } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useContent } from '../content/context'
import { useHomeReveal } from '../context/HomeRevealContext'
import { easeOutExpo } from '../lib/motion'
import { clearUrlHash } from '../lib/urls'

type Props = {
  variant?: 'home' | 'page'
}

const homeLinks = [
  { href: '/#projects', label: 'Projects' },
  { href: '/#compose', label: 'Music' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
]

export function Nav({ variant = 'home' }: Props) {
  const { site } = useContent()
  const phase = useHomeReveal()
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const reveal = phase !== 'intro'
  const navDelay = phase === 'revealing' ? 0.95 : 0.12
  /** After the piano intro, ignore a stale `/#section` until the user clicks nav. */
  const skipHomeHashScroll = useRef(phase === 'intro' || phase === 'revealing')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (variant === 'home' && (phase === 'intro' || phase === 'revealing')) {
      skipHomeHashScroll.current = true
      clearUrlHash()
      window.scrollTo(0, 0)
      return
    }

    if (variant === 'home' && skipHomeHashScroll.current) {
      skipHomeHashScroll.current = false
      clearUrlHash()
      window.scrollTo(0, 0)
      if (location.hash) {
        navigate({ pathname: location.pathname, search: location.search }, { replace: true })
      }
      return
    }

    if (location.hash) {
      const id = location.hash.slice(1)
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
      })
    } else if (variant === 'page') {
      window.scrollTo(0, 0)
    }
  }, [location, navigate, phase, variant])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <m.header
        className={`nav ${scrolled || variant === 'page' ? 'nav--solid' : ''}`}
        initial={{ y: -28, opacity: 0 }}
        animate={reveal ? { y: 0, opacity: 1 } : { y: -28, opacity: 0 }}
        transition={{ duration: 0.75, delay: navDelay, ease: easeOutExpo }}
      >
        <Link className="nav__brand" to="/">
          <span className="nav__name">{site.name}</span>
        </Link>
        <nav className="nav__links" aria-label="Primary">
          {homeLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </m.header>
    </>
  )
}
