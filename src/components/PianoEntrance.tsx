import { Canvas } from '@react-three/fiber'
import { m } from 'framer-motion'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useContent } from '../content/context'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { easeOutExpo, easeStudio } from '../lib/motion'
import { playPianoNote } from '../lib/pianoAudio'
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
  const [unlocking, setUnlocking] = useState(false)
  const [ready, setReady] = useState(false)
  const done = useRef(false)
  const revealStarted = useRef(false)

  useEffect(() => {
    window.scrollTo(0, 0)
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
      setUnlocking(true)
      beginReveal()
      if (note) {
        try {
          await playPianoNote(note, 2.1)
        } catch {
          /* autoplay policies — continue without audio */
        }
      }
      if (reduced) {
        window.setTimeout(finish, 220)
      }
    },
    [beginReveal, finish, reduced, unlocking],
  )

  const onKeyPlay = useCallback(
    (note: string) => {
      void unlock(note)
    },
    [unlock],
  )

  const exitDuration = reduced ? 0.35 : 2.4

  return (
    <m.div
      className="piano-entrance"
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
            ? { scale: 1.12, y: -28, filter: 'blur(10px)', opacity: 0 }
            : { scale: 1, y: 0, filter: 'blur(0px)', opacity: 1 }
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
            <Canvas
              className="piano-entrance__canvas"
              dpr={[1, 1.5]}
              camera={{ position: [0, 0.42, 0.72], fov: 26, near: 0.01, far: 20 }}
              gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMappingExposure: 0.78 }}
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
          )}
        </div>
      </m.div>

      <m.div
        className="piano-entrance__copy"
        animate={
          unlocking
            ? { opacity: 0, y: -36, filter: 'blur(6px)' }
            : { opacity: 1, y: 0, filter: 'blur(0px)' }
        }
        transition={{ duration: reduced ? 0.25 : exitDuration * 0.75, ease: easeOutExpo }}
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
        transition={{ duration: exitDuration * 0.85, ease: easeOutExpo }}
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
