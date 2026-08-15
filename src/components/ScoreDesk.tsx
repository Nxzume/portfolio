import { motion } from 'framer-motion'
import type { CSSProperties, MouseEvent } from 'react'
import { score, sketches } from '../content'
import { formatClock } from '../hooks/useSketchPlayer'
import { WaveformCanvas } from './WaveformCanvas'

type Props = {
  activeId: string | null
  intensity: number
  isPlaying: boolean
  currentTime: number
  duration: number
  canSeek: boolean
  onPlayTrack: (id: string) => void
  onSeek: (time: number) => void
}

function IconPlay() {
  return (
    <svg className="score__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M8.2 5.1a1 1 0 0 1 1.52-.86l10.1 6.4a1 1 0 0 1 0 1.72l-10.1 6.4A1 1 0 0 1 8.2 18V5.1Z" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg className="score__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect fill="currentColor" x="6.5" y="5" width="3.8" height="14" rx="1" />
      <rect fill="currentColor" x="13.7" y="5" width="3.8" height="14" rx="1" />
    </svg>
  )
}

export function ScoreDesk({
  activeId,
  intensity,
  isPlaying,
  currentTime,
  duration,
  canSeek,
  onPlayTrack,
  onSeek,
}: Props) {
  const progress = canSeek && duration > 0 ? Math.min(1, currentTime / duration) : 0

  return (
    <section className="section score" id="compose">
      <div className="section__head">
        <p className="eyebrow">{score.eyebrow}</p>
        <h2>{score.title}</h2>
        <p className="section__lede">{score.lede}</p>
      </div>

      <div className="score__stage">
        <div className="score__wave-frame" aria-hidden>
          <WaveformCanvas className="score__wave" fill intensity={activeId && isPlaying ? intensity : 0.2} />
        </div>
        <ul className="score__list">
          {sketches.map((sketch, i) => {
            const selected = activeId === sketch.id
            const playingThis = selected && isPlaying
            const showSeek = selected && Boolean(sketch.audio?.trim())
            return (
              <motion.li
                key={sketch.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.45 }}
              >
                <div className={`score__item ${selected ? 'is-active' : ''}`}>
                  <button
                    type="button"
                    className={`score__row ${selected ? 'is-playing' : ''}`}
                    onClick={() => onPlayTrack(sketch.id)}
                    aria-pressed={playingThis}
                    aria-label={playingThis ? `Pause ${sketch.title}` : `Play ${sketch.title}`}
                  >
                    <span className="score__play" aria-hidden>
                      {playingThis ? <IconPause /> : <IconPlay />}
                    </span>
                    <span className="score__meta">
                      <span className="score__title">{sketch.title}</span>
                      {sketch.mood?.trim() ? (
                        <span className="score__mood">{sketch.mood}</span>
                      ) : null}
                    </span>
                    {sketch.audio?.trim() ? null : (
                      <span className="score__bpm">{sketch.bpm ?? 100} BPM</span>
                    )}
                  </button>
                  {showSeek ? (
                    <div
                      className="score__scrub"
                      onClick={(e: MouseEvent) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <span className="score__time">{formatClock(currentTime)}</span>
                      <input
                        className="score__range"
                        type="range"
                        min={0}
                        max={canSeek ? duration : 1}
                        step={0.1}
                        value={canSeek ? currentTime : 0}
                        disabled={!canSeek}
                        aria-label={`Seek in ${sketch.title}`}
                        onChange={(e) => onSeek(Number(e.target.value))}
                        style={{ '--score-progress': `${progress * 100}%` } as CSSProperties}
                      />
                      <span className="score__time">{canSeek ? formatClock(duration) : '0:00'}</span>
                    </div>
                  ) : null}
                </div>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
