/**
 * The whole site in one process:
 *  - serves the prerendered static site from dist/
 *  - serves uploaded media from public/media/
 *  - /admin portal + /api/admin/* behind a password session
 *  - after every save: re-prerenders the pages and commits content + media
 *    to GitHub (GITHUB_TOKEN), so the repo is the durable store
 *  - on boot: pulls the latest content back from GitHub, so restarts never
 *    lose published edits
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createAuth, parseCookies } from './lib/auth.mjs'
import { loadConfig } from './lib/config.mjs'
import { ContentStore, HttpError, isValidFileKey } from './lib/contentStore.mjs'
import { collectContentFiles, publishSite } from './lib/github.mjs'
import { createPipeline } from './lib/pipeline.mjs'
import { syncFromGitHub } from './lib/sync.mjs'

const config = loadConfig()

if (!config.adminEnabled) {
  console.warn('[server] ADMIN_PASSWORD is not set — the admin portal is disabled.')
}
if (!config.publishEnabled) {
  console.warn('[server] GITHUB_TOKEN/GITHUB_REPO not set — edits stay local until configured.')
}

if (config.publishEnabled && config.syncOnBoot) {
  try {
    await syncFromGitHub({
      token: config.githubToken,
      repo: config.githubRepo,
      branch: config.contentBranch,
      contentDir: config.contentDir,
      mediaDir: config.mediaDir,
    })
  } catch (err) {
    console.error(`[sync] failed, using content baked into the image: ${err.message}`)
  }
}

const auth = createAuth({
  password: config.adminPassword,
  secret: config.adminSecret,
  ttlHours: config.sessionTtlHours,
})

const store = new ContentStore({
  contentDir: config.contentDir,
  mediaDir: config.mediaDir,
  maxUploadBytes: config.maxUploadBytes,
  maxDimension: config.mediaMaxDimension,
  quality: config.mediaQuality,
})

const publish = config.publishEnabled
  ? async () => {
      const files = await collectContentFiles({ contentDir: config.contentDir, mediaDir: config.mediaDir })
      return publishSite({
        token: config.githubToken,
        repo: config.githubRepo,
        branch: config.contentBranch,
        message: config.commitMessage,
        files,
      })
    }
  : null

const pipeline = createPipeline({
  contentDir: config.contentDir,
  distDir: config.distDir,
  publish,
})

// Content on disk may be newer than the pages baked at image build time.
pipeline.notifyContentChanged()

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', true)

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'none'",
      "form-action 'self'",
    ].join('; '),
  )
  next()
})

function noindex(req, res, next) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  next()
}

function sessionCookie(req, value, maxAgeSeconds) {
  const parts = [
    `${auth.cookieName}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ]
  if (req.secure) parts.push('Secure')
  return parts.join('; ')
}

function requireAuth(req, res, next) {
  if (!auth) return res.status(503).json({ error: 'Admin is disabled on this deployment.' })
  const cookies = parseCookies(req.headers.cookie)
  if (!auth.verifyCookie(cookies[auth.cookieName])) {
    return res.status(401).json({ error: 'Not signed in' })
  }
  next()
}

const admin = express.Router()
admin.use(noindex)

admin.post('/login', express.json({ limit: '10kb' }), async (req, res) => {
  if (!auth) return res.status(503).json({ error: 'Admin is disabled on this deployment.' })
  const ip = req.ip || 'unknown'
  if (auth.isLocked(ip)) return res.status(429).json({ error: 'Too many attempts — try again in a few minutes.' })
  const password = req.body?.password
  if (typeof password !== 'string' || !auth.checkPassword(password)) {
    auth.recordFail(ip)
    await new Promise((resolve) => setTimeout(resolve, 400))
    return res.status(401).json({ error: 'Wrong password' })
  }
  auth.resetFails(ip)
  res.setHeader('Set-Cookie', sessionCookie(req, auth.issueCookie(), config.sessionTtlHours * 3600))
  res.json({ ok: true })
})

admin.post('/logout', (req, res) => {
  if (auth) res.setHeader('Set-Cookie', sessionCookie(req, '', 0))
  res.json({ ok: true })
})

admin.get('/session', (req, res) => {
  if (!auth) return res.status(503).json({ error: 'Admin is disabled on this deployment.' })
  const cookies = parseCookies(req.headers.cookie)
  if (!auth.verifyCookie(cookies[auth.cookieName])) return res.status(401).json({ error: 'Not signed in' })
  res.json({ ok: true })
})

admin.get('/content', requireAuth, async (req, res) => {
  res.json(await store.readAll())
})

admin.put('/content/:key', requireAuth, express.json({ limit: '5mb' }), async (req, res) => {
  const key = req.params.key
  if (!isValidFileKey(key)) throw new HttpError(400, `Unknown content file: ${key}`)
  await store.writeFile(key, req.body)
  pipeline.notifyContentChanged()
  res.json({ ok: true })
})

admin.post('/projects', requireAuth, express.json({ limit: '100kb' }), async (req, res) => {
  const slug = String(req.body?.slug || '')
  const file = await store.createProject(slug)
  pipeline.notifyContentChanged()
  res.json({ ok: true, file })
})

admin.delete('/content/:key', requireAuth, express.json({ limit: '10kb' }), async (req, res) => {
  const key = req.params.key
  if (!key.startsWith('projects/')) throw new HttpError(400, 'Only projects can be deleted')
  await store.deleteProject(key.slice('projects/'.length))
  pipeline.notifyContentChanged()
  res.json({ ok: true })
})

admin.post('/media', requireAuth, express.json({ limit: '60mb' }), async (req, res) => {
  const publicPath = await store.saveUpload({ name: req.body?.name, dataBase64: req.body?.data })
  pipeline.notifyMediaChanged()
  res.json({ ok: true, path: publicPath })
})

admin.delete('/media', requireAuth, express.json({ limit: '10kb' }), async (req, res) => {
  await store.deleteMedia(req.body?.path)
  pipeline.notifyMediaChanged()
  res.json({ ok: true })
})

admin.get('/status', requireAuth, (req, res) => {
  res.json({
    repo: config.githubRepo || null,
    branch: config.contentBranch,
    publish: pipeline.state.publish,
    render: pipeline.state.render,
  })
})

admin.post('/publish', requireAuth, (req, res) => {
  pipeline.notifyMediaChanged()
  res.json({ ok: true, result: 'started' })
})

app.use('/api/admin', admin)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

app.get('/healthz', (req, res) => res.json({ ok: true }))

const distDir = path.resolve(config.distDir)
const publicDir = path.resolve(config.publicDir)

app.use(
  express.static(publicDir, {
    index: false,
    redirect: false,
    maxAge: '1h',
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}media${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=604800')
    },
  }),
)

app.use(
  express.static(distDir, {
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      }
    },
  }),
)

// The admin SPA route gets the pristine shell, never a prerendered page.
app.get(['/admin', '/admin/*splat'], noindex, (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.sendFile(path.join(distDir, '_shell.html'))
})

// Clean URLs for prerendered pages: /projects/arena -> dist/projects/arena/index.html
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()
  const pathname = req.path
  if (path.extname(pathname)) return next()
  const safe = path.normalize(pathname).replace(/^([/\\])+/, '')
  if (safe.startsWith('..')) return next()
  const page = path.join(distDir, safe, 'index.html')
  if (existsSync(page)) {
    res.setHeader('Cache-Control', 'no-cache')
    return res.sendFile(page)
  }
  const notFound = path.join(distDir, '404.html')
  if (existsSync(notFound)) {
    res.setHeader('Cache-Control', 'no-cache')
    return res.status(404).sendFile(notFound)
  }
  next()
})

app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err instanceof HttpError ? err.status : err.status || 500
  if (status >= 500) console.error('[server] error:', err)
  res.status(status).json({ error: status >= 500 ? 'Internal error' : err.message })
})

app.listen(config.port, () => {
  console.log(`[server] listening on :${config.port}`)
  console.log(`[server] admin portal: http://localhost:${config.port}/admin`)
})
