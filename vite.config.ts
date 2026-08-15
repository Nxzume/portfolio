import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Serve Decap’s /admin/index.html for /admin and /admin/ (Vite SPA would otherwise win). */
function adminIndexPlugin(): Plugin {
  const rewrite = (req: { url?: string }) => {
    if (req.url === '/admin' || req.url === '/admin/') {
      req.url = '/admin/index.html'
    }
  }
  return {
    name: 'admin-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req)
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req)
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), adminIndexPlugin()],
})
