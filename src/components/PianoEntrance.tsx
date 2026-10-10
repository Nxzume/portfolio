import { Canvas } from '@react-three/fiber'
import { m } from 'framer-motion'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useContent } from '../content/context'
import { useMotionBudget } from '../hooks/useMotionBudget'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { easeOutExpo, easeStudio } from '../lib/motion'
import { playPianoNote, primeAudio } from '../lib/pianoAudio'
import { markPianoUnlocked } from '../lib/pianoUnlock'
import { PianoScene } from './piano/PianoScene'
import '../styles/piano-entrance.css'

type Props = {
  onRevealBegin: () => void
  onComplete: () => void
}

export function PianoEntrance({ onRevealBegin, onComplete }: Props) {
  const { site } = useContent()
  const reduced = usePrefersReducedMotion()
  const budget = useMotionBudget()
  const [unlocking, setUnlocking] = useState(false)
  const [ready, setReady] = useState(false)
  const done = useRef(false)
  const revealStarted = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Prime Web Audio from a real DOM gesture — R3F hits alone won't unlock iOS audio.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onGesture = () => primeAudio()
    root.addEventListener('touchstart', onGesture, { passive: true })
    root.addEventListener('pointerdown', onGesture)
    return () => {
      root.removeEventListener('touchstart', onGesture)
      root.removeEventListener('pointerdown', onGesture)
    }
  }, [])

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    markPianoUnlocked()
    onComplete()
  }, [onComplete])

  const beginReveal = useCallback(() => {
    if (revealStarted.current) return
    revealStarted.current = true
    onRevealBegin()
  }, [onRevealBegin])

  const unlock = useCallback(
    async (note?: string) => {
      if (unlocking || done.current) return

      // Start the note in this turn, before React state updates yield the stack.
      primeAudio()
      const notePlay = note
        ? playPianoNote(note, budget.compact ? 1.8 : 2.4).catch(() => {
            /* autoplay policies — continue without audio */
          })
        : Promise.resolve()

      setUnlocking(true)
      beginReveal()
      await notePlay

      if (reduced) {
        window.setTimeout(finish, 180)
      }
    },
    [beginReveal, budget.compact, finish, reduced, unlocking],
  )

  const onKeyPlay = useCallback(
    (note: string) => {
      void unlock(note)
    },
    [unlock],
  )

  const exitDuration = reduced ? 0.3 : budget.compact ? 1.6 : 2.3

  return (
    <m.div
      ref={rootRef}
      className={`piano-entrance${unlocking ? ' piano-entrance--exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Enter portfolio"
      initial={{ opacity: 0 }}
      animate={{ opacity: unlocking ? 0 : 1 }}
      transition={{ duration: unlocking ? exitDuration : 0.55, ease: easeStudio }}
      onAnimationComplete={() => {
        if (unlocking) finish()
      }}
    >
      <m.div
        className="piano-entrance__flare"
        animate={
          unlocking
            ? { opacity: 0.55, scale: 1.25 }
            : { opacity: 0.18, scale: 1 }
        }
        transition={{ duration: exitDuration, ease: easeOutExpo }}
      />

      <m.div
        className="piano-entrance__stage-inner"
        animate={
          unlocking
            ? { scale: 1.1, y: -20, opacity: 0 }
            : { scale: 1, y: 0, opacity: 1 }
        }
        transition={{ duration: exitDuration, ease: easeOutExpo }}
      >
        <div className="piano-entrance__stage" aria-hidden={!ready && !reduced}>
          {reduced ? (
            <button
              type="button"
              className="piano-entrance__reduced"
              onClick={() => void unlock('C4')}
            >
              Enter
            </button>
          ) : (
            <div
              className="piano-entrance__canvas-hit"
              onPointerDown={() => primeAudio()}
              onTouchStart={() => primeAudio()}
            >
              <Canvas
                className="piano-entrance__canvas"
                dpr={budget.compact ? [1, 1] : [1, 1.25]}
                frameloop="demand"
                performance={{ min: 0.5, max: 1, debounce: 200 }}
                camera={{ position: [0, 0.42, 0.72], fov: 26, near: 0.01, far: 20 }}
                gl={{
                  antialias: !budget.compact,
                  alpha: false,
                  powerPreference: 'high-performance',
                  toneMappingExposure: 0.78,
                  stencil: false,
                  depth: true,
                }}
                onCreated={({ camera, gl }) => {
                  gl.toneMappingExposure = 0.78
                  camera.lookAt(0, 0.01, -0.05)
                  setReady(true)
                }}
              >
                <Suspense fallback={null}>
                  <PianoScene onKeyPlay={onKeyPlay} unlocking={unlocking} />
                </Suspense>
              </Canvas>
            </div>
          )}
        </div>
      </m.div>

      <m.div
        className="piano-entrance__copy"
        animate={
          unlocking
            ? { opacity: 0, y: -28 }
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: reduced ? 0.2 : exitDuration * 0.7, ease: easeOutExpo }}
      >
        <p className="piano-entrance__brand">{site.name}</p>
        <p className="piano-entrance__prompt">
          {reduced ? 'Enter the score' : 'Press a key to enter'}
        </p>
        <p className="piano-entrance__sub">Composer portfolio</p>
      </m.div>

      <m.div
        className="piano-entrance__curtain"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={
          unlocking
            ? { scaleY: 1.05, opacity: 1 }
            : { scaleY: 0, opacity: 0 }
        }
        transition={{ duration: exitDuration * 0.8, ease: easeOutExpo }}
      />

      <button
        type="button"
        className="piano-entrance__skip"
        disabled={unlocking}
        onClick={() => void unlock()}
      >
        Skip intro
      </button>
    </m.div>
  )
}
