import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { content } from './content'
import { ContentProvider } from './content/context'

const container = document.getElementById('root')!

const tree = (
  <StrictMode>
    <BrowserRouter>
      <ContentProvider value={content}>
        <App />
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>
)

// Prerendered pages arrive with markup already in place; dev and the SPA
// fallback do not.
if (container.firstElementChild) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
