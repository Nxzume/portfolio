/**
 * Turns the built SPA into static HTML files, one per route.
 *
 * Runs at build time and again inside the running server after every admin
 * save, so edits go live in about a second without a rebuild. Content is read
 * fresh from CONTENT_DIR on every run.
 *
 * Also writes dist/_shell.html — the pristine, unrendered SPA shell the
 * server uses for /admin and any client-side-only route.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DIST = process.env.DIST_DIR || 'dist'
const CONTENT_DIR = process.env.CONTENT_DIR || 'content'

const { render, routes, sitemapRoutes, loadContentFromDir } = await import(
  pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href
)

const content = loadContentFromDir(CONTENT_DIR)

const template = await readFile(path.join(DIST, 'index.html'), 'utf8')

if (!template.includes('<!--head:start-->')) {
  throw new Error('index.html is missing the <!--head:start--> marker; check vite.config.ts')
}

// Pristine shell for client-side-only routes (/admin). Written before
// index.html is overwritten with the prerendered homepage.
await writeFile(path.join(DIST, '_shell.html'), template, 'utf8')

function outputPath(route) {
  if (route === '/') return path.join(DIST, 'index.html')
  if (route === '/404') return path.join(DIST, '404.html')
  return path.join(DIST, route.replace(/^\//, ''), 'index.html')
}

for (const route of routes(content)) {
  const { html, head } = render(route, content)

  const page = template
    .replace(
      /<!--head:start-->[\s\S]*?<!--head:end-->/,
      `<!--head:start-->\n${head}\n    <!--head:end-->`,
    )
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)

  const file = outputPath(route)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, page, 'utf8')
  console.log(`prerendered ${route} -> ${path.relative('.', file)}`)
}

const origin = String(content.site.url || '').replace(/\/+$/, '')

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapRoutes(content).map((route) => `  <url><loc>${origin}${route}</loc></url>`),
  '</urlset>',
  '',
].join('\n')

await writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8')

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /admin',
  'Disallow: /api',
  origin ? `Sitemap: ${origin}/sitemap.xml` : '',
  '',
]
  .filter(Boolean)
  .join('\n')

await writeFile(path.join(DIST, 'robots.txt'), robots, 'utf8')
console.log('wrote sitemap.xml and robots.txt')
