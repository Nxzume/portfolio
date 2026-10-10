import { Route, Routes } from 'react-router-dom'
import { NotFound } from '../pages/NotFound'
import { ConceptA } from './ConceptA'
import { ConceptB } from './ConceptB'
import { ConceptC } from './ConceptC'
import { ConceptsIndex } from './ConceptsIndex'

/**
 * Draft homepage concepts, mounted under /concepts/* and loaded lazily so the
 * live site bundle, prerender list and sitemap are unaffected.
 */
export default function ConceptRoutes() {
  return (
    <Routes>
      <Route index element={<ConceptsIndex />} />
      <Route path="a" element={<ConceptA />} />
      <Route path="b" element={<ConceptB />} />
      <Route path="c" element={<ConceptC />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
