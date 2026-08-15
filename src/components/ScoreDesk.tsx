import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { Sketch } from '../content/types'
import { score, sketches } from '../content'
import { formatClock } from '../hooks/useSketchPlayer'
import { WaveformCanvas } from './WaveformCanvas'

type Props = {
  activeId: string | null
  activeSketch: Sketch | null
  intensity: number
  isPlaying: boolean
  currentTime: number
  duration: number
  canSeek: boolean
  onPlayTrack: (id: string) => void
  onTogglePause: () => void
  onStop: () => void
  onSeek: (time: number) => void
  onPrev: () => void
  onNext: () => void
}

export function ScoreDesk({
  activeId,
  activeSketch,
  intensity,
  isPlaying,
  currentTime,
  duration,
  canSeek,
  onPlayTrack,
  onTogglePause,
  onStop,
  onSeek,
  onPrev,
  onNext,
}: Props) {
  const progress = canSeek && duration > 0 ? Math.min(1, currentTime / duration) : 0
  const nowLabel = activeSketch?.title ?? 'Select a track'

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
            return (
              <motion.li
                key={sketch.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.45 }}
              >
                <button
                  type="button"
                  className={`score__row ${selected ? 'is-playing' : ''}`}
                  onClick={() => onPlayTrack(sketch.id)}
                  aria-pressed={playingThis}
                  aria-label={
                    playingThis ? `Pause ${sketch.title}` : `Play ${sketch.title}`
                  }
                >
                  <span className="score__play" aria-hidden>
                    {playingThis ? '❚❚' : '▶'}
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
              </motion.li>
            )
          })}
        </ul>
      </div>

      <div className="score__transport" role="group" aria-label="Playback controls">
        <p className="score__now">{nowLabel}</p>
        <div className="score__buttons">
          <button type="button" className="score__ctrl" onClick={onPrev} aria-label="Previous track" disabled={!sketches.length}>
            ⏮
          </button>
          <button
            type="button"
            className="score__ctrl score__ctrl--main"
            onClick={onTogglePause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={!sketches.length}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <button type="button" className="score__ctrl" onClick={onStop} aria-label="Stop" disabled={!activeId}>
            ■
          </button>
          <button type="button" className="score__ctrl" onClick={onNext} aria-label="Next track" disabled={!sketches.length}>
            ⏭
          </button>
        </div>
        <div className="score__scrub">
          <span className="score__time">{formatClock(currentTime)}</span>
          <input
            className="score__range"
            type="range"
            min={0}
            max={canSeek ? duration : 1}
            step={0.1}
            value={canSeek ? currentTime : 0}
            disabled={!canSeek}
            aria-label="Seek"
            onChange={(e) => onSeek(Number(e.target.value))}
            style={{ '--score-progress': `${progress * 100}%` } as CSSProperties}
          />
          <span className="score__time">{canSeek ? formatClock(duration) : '—:—'}</span>
        </div>
      </div>
    </section>
  )
}
