/**
 * After every admin change: re-prerender the static pages (content edits),
 * then publish content + media to GitHub. Runs are serialized and coalesced —
 * rapid saves collapse into one render + one commit.
 */
import { execFile } from 'node:child_process'

function run(cmd, args, options) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 120_000, ...options }, (err, stdout, stderr) => {
      if (err) reject(new Error(`${cmd} ${args.join(' ')} failed: ${stderr || err.message}`))
      else resolve(stdout)
    })
  })
}

export function createPipeline({ contentDir, distDir, publish, log = console }) {
  let running = false
  let renderNeeded = false
  let publishNeeded = false

  const state = {
    render: { state: 'idle', lastAt: null, error: null },
    publish: {
      state: publish ? 'idle' : 'disabled',
      pending: false,
      last: null,
      error: null,
    },
  }

  async function render() {
    await run('node', ['scripts/prerender.mjs'], {
      env: { ...process.env, CONTENT_DIR: contentDir, DIST_DIR: distDir },
    })
  }

  async function loop() {
    if (running) return
    running = true
    try {
      while (renderNeeded || publishNeeded) {
        if (renderNeeded) {
          renderNeeded = false
          state.render = { state: 'working', lastAt: state.render.lastAt, error: null }
          try {
            await render()
            state.render = { state: 'idle', lastAt: new Date().toISOString(), error: null }
            log.log('[pipeline] pages re-rendered')
          } catch (err) {
            state.render = { state: 'error', lastAt: state.render.lastAt, error: String(err.message || err) }
            log.error('[pipeline] render failed:', err.message)
          }
        }
        if (publishNeeded) {
          publishNeeded = false
          if (!publish) {
            state.publish.state = 'disabled'
            state.publish.pending = false
            continue
          }
          state.publish.state = 'working'
          state.publish.pending = renderNeeded || publishNeeded
          try {
            const result = await publish()
            state.publish = {
              state: 'idle',
              pending: renderNeeded || publishNeeded,
              last: {
                sha: result.sha || null,
                at: new Date().toISOString(),
                result: result.result,
              },
              error: null,
            }
            log.log(`[pipeline] published to GitHub: ${result.result}${result.sha ? ` ${result.sha.slice(0, 7)}` : ''}`)
          } catch (err) {
            state.publish = { ...state.publish, state: 'error', pending: false, error: String(err.message || err) }
            log.error('[pipeline] publish failed:', err.message)
          }
        }
      }
    } finally {
      running = false
    }
  }

  return {
    state,
    notifyContentChanged() {
      renderNeeded = true
      publishNeeded = true
      if (state.publish.state !== 'disabled') state.publish.pending = true
      void loop()
    },
    notifyMediaChanged() {
      publishNeeded = true
      if (state.publish.state !== 'disabled') state.publish.pending = true
      void loop()
    },
    async flush() {
      while (running || renderNeeded || publishNeeded) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    },
  }
}
