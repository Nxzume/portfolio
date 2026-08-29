import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PortfolioContentProvider } from './content'

const container = document.getElementById('root')!

createRoot(container).render(
  <StrictMode>
    <PortfolioContentProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PortfolioContentProvider>
  </StrictMode>,
)
