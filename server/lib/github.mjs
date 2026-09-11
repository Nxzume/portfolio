/**
 * Publishes content + media to GitHub through the Git Data API (blobs → tree
 * → commit → ref), so the repo always holds the full site content. Only files
 * under content/ and public/media/ are ever touched.
 *
 * Also downloads repo tarballs for boot sync.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const API = 'https://api.github.com'

/** Git blob SHA-1, computed exactly like git does — lets us skip unchanged files. */
export function gitBlobSha(bytes) {
  const hash = createHash('sha1')
  hash.update(`blob ${bytes.length}\0`)
  hash.update(bytes)
  return hash.digest('hex')
}

/** Map of repo-relative posix path -> file bytes for every managed file on disk. */
export async function collectContentFiles({ contentDir, mediaDir }) {
  const files = new Map()

  async function walk(dir, prefix) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(full, `${prefix}${entry.name}/`)
      else if (entry.isFile()) files.set(`${prefix}${entry.name}`, await readFile(full))
    }
  }

  await walk(contentDir, 'content/')
  await walk(mediaDir, 'public/media/')
  return files
}

export function isManagedPath(filePath) {
  return filePath.startsWith('content/') || filePath.startsWith('public/media/')
}

async function gh(token, pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.message || `GitHub ${method} ${pathname} -> ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

async function getRefSha(token, repo, branch) {
  try {
    const ref = await gh(token, `/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`)
    return ref.object.sha
  } catch (err) {
    if (err.status !== 404) throw err
    // First publish to a fresh branch: fork it from the default branch head.
    const repoInfo = await gh(token, `/repos/${repo}`)
    const baseSha = await getRefSha(token, repo, repoInfo.default_branch)
    await gh(token, `/repos/${repo}/git/refs`, {
      method: 'POST',
      body: { ref: `refs/heads/${branch}`, sha: baseSha },
    })
    return baseSha
  }
}

/** Diff local files against the remote tree: what to upload, what to delete. */
export function planChanges(localFiles, remoteManagedEntries) {
  const remoteByPath = new Map(remoteManagedEntries.map((entry) => [entry.path, entry.sha]))
  const uploads = []
  for (const [filePath, bytes] of localFiles) {
    const sha = gitBlobSha(bytes)
    if (remoteByPath.get(filePath) !== sha) uploads.push({ path: filePath, bytes })
  }
  const deletions = [...remoteByPath.keys()].filter((filePath) => !localFiles.has(filePath))
  return { uploads, deletions }
}

/** Tree entries for the Git Data API; deletions keep mode/type with sha null. */
export function buildTreeEntries(uploadedBlobs, deletions) {
  return [
    ...uploadedBlobs.map(({ path: filePath, sha }) => ({
      path: filePath,
      mode: '100644',
      type: 'blob',
      sha,
    })),
    ...deletions.map((filePath) => ({ path: filePath, mode: '100644', type: 'blob', sha: null })),
  ]
}

async function publishOnce({ token, repo, branch, message, files }) {
  const refSha = await getRefSha(token, repo, branch)
  const commit = await gh(token, `/repos/${repo}/git/commits/${refSha}`)
  const tree = await gh(token, `/repos/${repo}/git/trees/${commit.tree.sha}?recursive=1`)
  const managed = (tree.tree || []).filter((entry) => entry.type === 'blob' && isManagedPath(entry.path))

  const { uploads, deletions } = planChanges(files, managed)
  if (uploads.length === 0 && deletions.length === 0) {
    return { result: 'unchanged', sha: refSha }
  }

  const uploadedBlobs = []
  for (const upload of uploads) {
    const blob = await gh(token, `/repos/${repo}/git/blobs`, {
      method: 'POST',
      body: { content: upload.bytes.toString('base64'), encoding: 'base64' },
    })
    uploadedBlobs.push({ path: upload.path, sha: blob.sha })
  }
  const treeEntries = buildTreeEntries(uploadedBlobs, deletions)

  const newTree = await gh(token, `/repos/${repo}/git/trees`, {
    method: 'POST',
    body: { base_tree: commit.tree.sha, tree: treeEntries },
  })
  const newCommit = await gh(token, `/repos/${repo}/git/commits`, {
    method: 'POST',
    body: { message, tree: newTree.sha, parents: [refSha] },
  })
  await gh(token, `/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: { sha: newCommit.sha, force: false },
  })
  return { result: 'committed', sha: newCommit.sha }
}

/**
 * Commit every managed file that differs from the remote branch.
 * Retries once on a non-fast-forward (someone else pushed meanwhile).
 */
export async function publishSite(options) {
  try {
    return await publishOnce(options)
  } catch (err) {
    if (err.status === 422 || /fast-forward/i.test(err.message)) {
      return await publishOnce(options)
    }
    throw err
  }
}

/** Latest commit sha of a branch, or null when it does not exist. */
export async function getBranchHead(token, repo, branch) {
  try {
    const ref = await gh(token, `/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`)
    return ref.object.sha
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

/** Download a repo tarball (Buffer) for boot sync. */
export async function downloadRepoTarball({ token, repo, ref }) {
  const res = await fetch(`${API}/repos/${repo}/tarball/${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    redirect: 'manual',
  })
  if (res.status !== 302) {
    throw new Error(`GitHub tarball request failed: ${res.status}`)
  }
  const location = res.headers.get('location')
  if (!location) throw new Error('GitHub tarball request missing redirect location')
  const tar = await fetch(location, { headers: { Authorization: `Bearer ${token}` } })
  if (!tar.ok) throw new Error(`Tarball download failed: ${tar.status}`)
  return Buffer.from(await tar.arrayBuffer())
}
