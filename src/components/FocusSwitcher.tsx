import { AnimatePresence, m } from 'framer-motion'
import { focuses, type FocusId } from '../content'

type Props = {
  active: FocusId
  onChange: (id: FocusId) => void
}

export function FocusSwitcher({ active, onChange }: Props) {
  const current = focuses.find((f) => f.id === active) ?? focuses[0]

  if (!current) return null

  return (
    <section className="focus" aria-label="Areas of focus">
      <div className="focus__tabs" role="tablist">
        {focuses.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={active === f.id}
            className={`focus__tab ${active === f.id ? 'is-active' : ''}`}
            onClick={() => onChange(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <m.div
          key={current.id}
          className="focus__panel"
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
        >
          <h2>{current.headline}</h2>
          <p>{current.body}</p>
        </m.div>
      </AnimatePresence>
    </section>
  )
}
