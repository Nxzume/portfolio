/**
 * Boot sync: pull the latest content + media from the GitHub branch, so a
 * container restart (which resets the filesystem to the built image) still
 * serves the newest published content.
 */
import { cp, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { downloadRepoTarball } from './github.mjs'

function untar(file, dest) {
  return new Promise((resolve, reject) => {
    execFile('tar', ['-xzf', file, '-C', dest], (err, _stdout, stderr) => {
      if (err) reject(new Error(`tar failed: ${stderr || err.message}`))
      else resolve()
    })
  })
}

async function replaceDir(source, target, log, label) {
  if (!existsSync(source)) {
    log.warn(`[sync] tarball has no ${label}/ — keeping baked version`)
    return 0
  }
  const backup = `${target}.prev-${process.pid}`
  await rm(backup, { recursive: true, force: true })
  if (existsSync(target)) await cp(target, backup, { recursive: true })
  try {
    await rm(target, { recursive: true, force: true })
    await cp(source, target, { recursive: true })
    const count = (await readdir(target, { recursive: true })).length
    await rm(backup, { recursive: true, force: true })
    return count
  } catch (err) {
    // Restore the baked version rather than boot with an empty content dir.
    await rm(target, { recursive: true, force: true })
    if (existsSync(backup)) await cp(backup, target, { recursive: true })
    await rm(backup, { recursive: true, force: true })
    throw err
  }
}

export async function syncFromGitHub({ token, repo, branch, contentDir, publicDir, log = console }) {
  const tarball = await downloadRepoTarball({ token, repo, ref: branch })
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'site-sync-'))
  try {
    const tarPath = path.join(tmp, 'repo.tar.gz')
    await writeFile(tarPath, tarball)
    await untar(tarPath, tmp)
    const [root] = await readdir(tmp)
    const repoRoot = path.join(tmp, root)

    const contentCount = await replaceDir(path.join(repoRoot, 'content'), contentDir, log, 'content')
    let mediaCount = 0
    for (const sub of ['media', 'images', 'audio']) {
      mediaCount += await replaceDir(
        path.join(repoRoot, 'public', sub),
        path.join(publicDir, sub),
        log,
        `public/${sub}`,
      )
    }
    log.log(`[sync] pulled latest content (${contentCount} files) and media (${mediaCount} files) from ${repo}@${branch}`)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}
