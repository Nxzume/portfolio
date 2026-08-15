/**
 * Turns the built SPA into static HTML files, one per route.
 *
 * Vercel serves a matching file from the filesystem before applying the SPA
 * rewrite, so /projects/arena gets real markup and real meta tags. Anything
 * without a file still falls back to index.html and renders client-side.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DIST = 'dist'

const { render, routes, sitemapRoutes, siteOrigin } = await import(
  pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href
)

const template = await readFile(path.join(DIST, 'index.html'), 'utf8')

if (!template.includes('<!--head:start-->')) {
  throw new Error('index.html is missing the <!--head:start--> marker; check vite.config.ts')
}

function outputPath(route) {
  if (route === '/') return path.join(DIST, 'index.html')
  if (route === '/404') return path.join(DIST, '404.html')
  return path.join(DIST, route.replace(/^\//, ''), 'index.html')
}

for (const route of routes()) {
  const { html, head } = render(route)

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

const origin = String(siteOrigin || '').replace(/\/+$/, '')

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapRoutes().map((route) => `  <url><loc>${origin}${route}</loc></url>`),
  '</urlset>',
  '',
].join('\n')

await writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8')

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /admin/',
  origin ? `Sitemap: ${origin}/sitemap.xml` : '',
  '',
]
  .filter(Boolean)
  .join('\n')

await writeFile(path.join(DIST, 'robots.txt'), robots, 'utf8')
console.log('wrote sitemap.xml and robots.txt')
