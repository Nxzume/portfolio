import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { site } from './content'
import { HomePage } from './pages/HomePage'
import { ProjectPage } from './pages/ProjectPage'
import './App.css'

function App() {
  useEffect(() => {
    document.title = `${site.name} — Composer & Level Designer`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', `${site.name} — ${site.tagline}`)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects/:slug" element={<ProjectPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
