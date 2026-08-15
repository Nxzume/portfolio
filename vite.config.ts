import { readFileSync } from 'node:fs'
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

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/**
 * Writes the site name and tagline from the CMS into the HTML shell, so the
 * static document never disagrees with `content/site.json`.
 *
 * These are only the defaults: `scripts/prerender.mjs` replaces the marked
 * block with per-page tags for every prerendered route.
 */
function headPlugin(): Plugin {
  return {
    name: 'app-head',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let name = 'Portfolio'
        let tagline = ''
        try {
          const site = JSON.parse(readFileSync('content/site.json', 'utf8'))
          name = String(site.name || name)
          tagline = String(site.tagline || '')
        } catch {
          /* fall back to the generic title */
        }

        const head = [
          '<!--head:start-->',
          `    <title>${escapeAttr(name)} — Composer &amp; Level Designer</title>`,
          `    <meta name="description" content="${escapeAttr(tagline)}" />`,
          '    <!--head:end-->',
        ].join('\n')

        return html.replace('<!--app-head-->', head)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), adminIndexPlugin(), headPlugin()],
})
