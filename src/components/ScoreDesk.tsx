import { motion } from 'framer-motion'
import { score, sketches } from '../content'
import { WaveformCanvas } from './WaveformCanvas'

type Props = {
  activeId: string | null
  intensity: number
  onPlay: (id: string) => void
}

export function ScoreDesk({ activeId, intensity, onPlay }: Props) {
  return (
    <section className="section score" id="compose">
      <div className="section__head">
        <p className="eyebrow">{score.eyebrow}</p>
        <h2>{score.title}</h2>
        <p className="section__lede">{score.lede}</p>
      </div>

      <div className="score__stage">
        <div className="score__wave-frame" aria-hidden>
          <WaveformCanvas className="score__wave" fill intensity={activeId ? intensity : 0.2} />
        </div>
        <ul className="score__list">
          {sketches.map((sketch, i) => {
            const playing = activeId === sketch.id
            return (
              <motion.li
                key={sketch.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
              >
                <button
                  type="button"
                  className={`score__row ${playing ? 'is-playing' : ''}`}
                  onClick={() => onPlay(sketch.id)}
                  aria-pressed={playing}
                >
                  <span className="score__play" aria-hidden>
                    {playing ? '■' : '▶'}
                  </span>
                  <span className="score__meta">
                    <span className="score__title">{sketch.title}</span>
                    <span className="score__mood">
                      {sketch.mood}
                      {sketch.audio ? ' · audio file' : ' · generative'}
                    </span>
                  </span>
                  <span className="score__bpm">{sketch.bpm} BPM</span>
                </button>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
