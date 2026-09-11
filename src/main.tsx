import { StrictMode, Suspense, lazy } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { content } from './content'
import { ContentProvider } from './content/context'

const AdminApp = lazy(() => import('./admin/AdminApp'))

const container = document.getElementById('root')!

/**
 * The admin portal mounts outside the site BrowserRouter. Its live preview
 * needs its own MemoryRouter, and React Router forbids nesting routers.
 */
const isAdmin =
  window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')

const tree = isAdmin ? (
  <StrictMode>
    <Suspense fallback={null}>
      <AdminApp />
    </Suspense>
  </StrictMode>
) : (
  <StrictMode>
    <BrowserRouter>
      <ContentProvider value={content}>
        <App />
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>
)

// Prerendered pages arrive with markup already in place; dev and the SPA
// fallback (including /admin) do not.
if (container.firstElementChild) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
