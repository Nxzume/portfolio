import { AnimatePresence, m } from 'framer-motion'
import { useEffect, useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { site } from '../content'
import { useDialog } from '../hooks/useDialog'

type Props = {
  variant?: 'home' | 'page'
}

const homeLinks = [
  { href: '/#compose', label: 'Music' },
  { href: '/#projects', label: 'Projects' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
]

const MOBILE_MQ = '(max-width: 720px)'

/** Starts false so prerendered and hydrated markup match, then syncs on mount. */
function useIsMobile() {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return mobile
}

export function Nav({ variant = 'home' }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [away, setAway] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isMobile = useIsMobile()
  const menuTitleId = useId()
  const sheetRef = useDialog<HTMLDivElement>(menuOpen, () => setMenuOpen(false))

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      setAway(y > 48)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
      })
    } else if (variant === 'page') {
      window.scrollTo(0, 0)
    }
    setMenuOpen(false)
  }, [location, variant])

  useEffect(() => {
    if (!isMobile) setMenuOpen(false)
  }, [isMobile])

  const showDock = isMobile && away

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <m.header
        className={`nav ${scrolled || variant === 'page' ? 'nav--solid' : ''} ${
          showDock ? 'nav--away' : ''
        }`}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: showDock ? '-110%' : 0, opacity: showDock ? 0 : 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link className="nav__brand" to="/">
          {site.name}
        </Link>
        <nav className="nav__links" aria-label="Primary">
          {homeLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </m.header>

      <AnimatePresence>
        {showDock && !menuOpen ? (
          <m.div
            key="nav-dock"
            className="nav-dock-wrap"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className="nav-dock"
              aria-label="Open site menu"
              aria-expanded={false}
              aria-haspopup="dialog"
              onClick={() => setMenuOpen(true)}
            >
              <span className="nav-dock__mark" aria-hidden />
              Menu
            </button>
          </m.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen ? (
          <m.div
            key="nav-sheet"
            className="nav-sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              className="nav-sheet__backdrop"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
            />
            <m.div
              ref={sheetRef}
              className="nav-sheet__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={menuTitleId}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="nav-sheet__head">
                <p id={menuTitleId} className="nav-sheet__title">
                  Go to
                </p>
                <button type="button" className="nav-sheet__close" onClick={() => setMenuOpen(false)}>
                  Close
                </button>
              </div>
              <nav className="nav-sheet__links" aria-label="Page sections">
                <Link className="nav-sheet__home" to="/" onClick={() => setMenuOpen(false)}>
                  {site.name}
                </Link>
                {homeLinks.map((link) => (
                  <Link key={link.href} to={link.href} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
