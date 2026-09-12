import { AnimatePresence, m } from 'framer-motion'
import { useContent } from '../content/context'
import type { FocusId } from '../content/types'

type Props = {
  active: FocusId
  onChange: (id: FocusId) => void
}

/** Numbered accordion — each craft is a row that opens in place. */
export function FocusSwitcher({ active, onChange }: Props) {
  const { focuses } = useContent()

  if (focuses.length === 0) return null

  return (
    <section className="focus" aria-label="Areas of focus">
      <div className="focus__list">
        {focuses.map((f) => {
          const open = f.id === active
          return (
            <div key={f.id} className={`focus__row ${open ? 'is-open' : ''}`}>
              <button
                type="button"
                className="focus__row-head"
                aria-expanded={open}
                aria-controls={`focus-panel-${f.id}`}
                onClick={() => onChange(f.id)}
              >
                <span className="focus__label">{f.label}</span>
                <span className="focus__headline">{f.headline}</span>
                <span className="focus__toggle" aria-hidden>
                  {open ? '−' : '+'}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <m.div
                    key={f.id}
                    id={`focus-panel-${f.id}`}
                    className="focus__panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{f.body}</p>
                  </m.div>
                ) : null}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}
