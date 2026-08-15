import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { NotFound } from './pages/NotFound'
import { ProjectPage } from './pages/ProjectPage'
import './App.css'

/**
 * The router lives in the entry points so the same tree can be prerendered
 * (StaticRouter) and hydrated (BrowserRouter).
 *
 * `strict` on LazyMotion rejects the full `motion.*` components, which would
 * pull the whole animation bundle back in.
 */
function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects/:slug" element={<ProjectPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MotionConfig>
    </LazyMotion>
  )
}

export default App
