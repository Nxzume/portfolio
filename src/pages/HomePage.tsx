import { m } from 'framer-motion'
import { lazy, Suspense, useLayoutEffect, useState } from 'react'
import { PageHead } from '../components/PageHead'
import { HomeLayout } from '../components/home/HomeLayout'
import { usePreviewMode } from '../components/PreviewMode'
import { HomeRevealProvider, type HomeRevealPhase } from '../context/HomeRevealContext'
import { useContent } from '../content/context'
import { homeMeta } from '../lib/meta'
import { easeOutExpo, revealTransition } from '../lib/motion'
import { isPianoUnlocked } from '../lib/pianoUnlock'
import { clearUrlHash } from '../lib/urls'

const PianoEntrance = lazy(() =>
  import('../components/PianoEntrance').then((mod) => ({ default: mod.PianoEntrance })),
)

export function HomePage() {
  const content = useContent()
  const preview = usePreviewMode()
  const [phase, setPhase] = useState<HomeRevealPhase>(() =>
    preview || isPianoUnlocked() ? 'live' : 'intro',
  )
  const showEntrance = !preview && (phase === 'intro' || phase === 'revealing')

  // Lock scroll before the lazy piano chunk loads — otherwise the browser can
  // restore a mid-page position under the intro overlay.
  useLayoutEffect(() => {
    if (!showEntrance) return

    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevRestoration =
      'scrollRestoration' in history ? history.scrollRestoration : null

    document.body.classList.add('has-piano-intro')
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    if (prevRestoration !== null) {
      history.scrollRestoration = 'manual'
    }
    clearUrlHash()
    window.scrollTo(0, 0)

    return () => {
      clearUrlHash()
      window.scrollTo(0, 0)
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.classList.remove('has-piano-intro')
      if (prevRestoration !== null) {
        history.scrollRestoration = prevRestoration
      }
    }
  }, [showEntrance])

  return (
    <HomeRevealProvider phase={phase}>
      <m.div
        className={`app ${phase === 'intro' ? 'app--under-intro' : ''} ${phase === 'revealing' ? 'app--revealing' : ''} ${phase === 'live' ? 'app--live' : ''}`}
        initial={false}
        animate={
          phase === 'intro'
            ? { opacity: 0, scale: 1.04, y: 24 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{
          ...revealTransition,
          // Start the site reveal immediately — overlay already ignores pointers.
          delay: phase === 'revealing' ? 0.4 : 0,
          ease: easeOutExpo,
        }}
      >
        <PageHead meta={homeMeta(content)} />
        <HomeLayout />
      </m.div>

      {showEntrance ? (
        <Suspense fallback={null}>
          <PianoEntrance
            onRevealBegin={() => setPhase('revealing')}
            onComplete={() => {
              clearUrlHash()
              window.scrollTo(0, 0)
              setPhase('live')
            }}
          />
        </Suspense>
      ) : null}
    </HomeRevealProvider>
  )
}
