/**
 * Regression test: re-running prerender must produce pages from the CURRENT
 * content. The first run overwrites dist/index.html with rendered markup, so
 * a second run that used it as the template would keep the stale body.
 */
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const PRERENDER = path.resolve(__dirname, 'prerender.mjs')

const SHELL = `<!doctype html>
<html><head>
<!--head:start-->
    <!--head:end-->
</head><body><div id="root"></div></body></html>
`

const ENTRY_SERVER = `
import { readFileSync } from 'node:fs'
import path from 'node:path'
export function loadContentFromDir(dir) {
  const hero = JSON.parse(readFileSync(path.join(dir, 'hero.json'), 'utf8'))
  return { site: { url: 'https://example.com', name: 'Fixture' }, headline: hero.headline }
}
export function routes() { return ['/'] }
export function sitemapRoutes() { return ['/'] }
export function render(url, content) {
  return { html: \`<p>\${content.headline}</p>\`, head: \`<title>\${content.headline}</title>\` }
}
`

let fixture

function runPrerender() {
  return new Promise((resolve, reject) => {
    execFile(
      'node',
      [PRERENDER],
      {
        cwd: fixture,
        env: {
          ...process.env,
          CONTENT_DIR: path.join(fixture, 'content'),
          DIST_DIR: path.join(fixture, 'dist'),
        },
      },
      (err, _stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve()),
    )
  })
}

async function setHeadline(headline) {
  await writeFile(path.join(fixture, 'content', 'hero.json'), JSON.stringify({ headline }))
}

beforeEach(async () => {
  fixture = await mkdtemp(path.join(os.tmpdir(), 'prerender-'))
  await mkdir(path.join(fixture, 'content'), { recursive: true })
  await mkdir(path.join(fixture, 'dist-ssr'), { recursive: true })
  await mkdir(path.join(fixture, 'dist'), { recursive: true })
  await writeFile(path.join(fixture, 'dist', 'index.html'), SHELL)
  await writeFile(path.join(fixture, 'dist-ssr', 'entry-server.js'), ENTRY_SERVER)
})

afterEach(async () => {
  await rm(fixture, { recursive: true, force: true })
})

describe('prerender', () => {
  it('re-renders reflect new content, not the previously rendered page', async () => {
    await setHeadline('First headline')
    await runPrerender()
    const first = await readFile(path.join(fixture, 'dist', 'index.html'), 'utf8')
    expect(first).toContain('First headline')

    await setHeadline('Second headline')
    await runPrerender()
    const second = await readFile(path.join(fixture, 'dist', 'index.html'), 'utf8')
    expect(second).toContain('Second headline')
    expect(second).not.toContain('First headline')
  }, 30_000)

  it('keeps _shell.html pristine across runs', async () => {
    await setHeadline('Anything')
    await runPrerender()
    await runPrerender()
    const shell = await readFile(path.join(fixture, 'dist', '_shell.html'), 'utf8')
    expect(shell).toContain('<div id="root"></div>')
  }, 30_000)

  it('fails loudly instead of shipping stale pages when the shell is polluted', async () => {
    await setHeadline('Rendered body')
    await runPrerender()
    // Simulate the historical bug: _shell.html overwritten with rendered markup.
    const rendered = await readFile(path.join(fixture, 'dist', 'index.html'), 'utf8')
    await writeFile(path.join(fixture, 'dist', '_shell.html'), rendered)
    await expect(runPrerender()).rejects.toThrow(/not pristine/)
  }, 30_000)
})
