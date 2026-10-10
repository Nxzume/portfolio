import { Link } from 'react-router-dom'
import { useContent } from '../content/context'
import { PageHead } from '../components/PageHead'
import { concepts } from './data'
import './concepts.css'

export function ConceptsIndex() {
  const { site } = useContent()
  return (
    <div className="concepts-index">
      <PageHead
        meta={{
          title: `Layout concepts — ${site.name}`,
          description: 'Draft homepage layout and flow explorations.',
          path: '/concepts',
          noindex: true,
        }}
      />
      <div className="concepts-index__inner">
        <p className="concepts-index__eyebrow">Layout &amp; flow exploration · drafts</p>
        <h1>Three ways to tell the same story</h1>
        <p className="concepts-index__lede">
          Each concept is a navigable homepage built from the real content of this site. They are
          not linked from the live site and are never prerendered or indexed.
        </p>

        <ul className="concepts-grid">
          {concepts.map((concept) => (
            <li key={concept.id}>
              <Link className="concept-card" to={`/concepts/${concept.id}`}>
                <span className="concept-card__id">Concept {concept.id.toUpperCase()}</span>
                <h2>{concept.name}</h2>
                <p className="concept-card__kicker">{concept.kicker}</p>
                <p className="concept-card__summary">{concept.summary}</p>
                <p className="concept-card__order">{concept.order}</p>
                <span className="concept-card__swatches" aria-hidden>
                  {concept.swatches.map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </span>
                <span className="concept-card__open">Open concept →</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="concepts-index__notes">
          Append <code>?bare=1</code> to any concept URL to hide the floating switcher.{' '}
          <a href="/">Back to the live site</a>
        </p>
      </div>
    </div>
  )
}
