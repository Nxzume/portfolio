/** Run the image bake script so /images/optimized exists after sync/build. */
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const script = path.join(root, 'scripts/optimize-images.mjs')

export function optimizeImages({ cwd = root, log = console } = {}) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [script], { cwd }, (err, stdout, stderr) => {
      if (stdout) log.log(String(stdout).trimEnd())
      if (stderr) log.warn(String(stderr).trimEnd())
      if (err) reject(err)
      else resolve()
    })
  })
}
