import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

type Props = {
  variant?: 'home' | 'page'
}

const homeLinks = [
  { href: '/#compose', label: 'Score' },
  { href: '/#projects', label: 'Projects' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
]

export function Nav({ variant = 'home' }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      })
    } else if (variant === 'page') {
      window.scrollTo(0, 0)
    }
  }, [location, variant])

  return (
    <motion.header
      className={`nav ${scrolled || variant === 'page' ? 'nav--solid' : ''}`}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link className="nav__brand" to="/">
        Alexandre Guichet
      </Link>
      <nav className="nav__links" aria-label="Primary">
        {homeLinks.map((link) => (
          <Link key={link.href} to={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </motion.header>
  )
}
