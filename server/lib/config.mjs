/**
 * Central env parsing for the site server. Everything has a safe default
 * except ADMIN_PASSWORD — without it the admin API stays disabled.
 */
export function loadConfig(env = process.env) {
  const port = Number(env.PORT || 3000)
  const adminPassword = env.ADMIN_PASSWORD || ''
  const githubToken = env.GITHUB_TOKEN || ''
  const githubRepo = env.GITHUB_REPO || '' // "owner/name"
  const contentBranch = env.CONTENT_BRANCH || 'master'

  return {
    port: Number.isFinite(port) && port > 0 ? port : 3000,
    adminPassword,
    adminSecret: env.ADMIN_SECRET || adminPassword,
    sessionTtlHours: Number(env.SESSION_TTL_HOURS || 12),
    githubToken,
    githubRepo,
    contentBranch,
    syncOnBoot: (env.SYNC_ON_BOOT || 'true') !== 'false',
    maxUploadBytes: Number(env.MAX_UPLOAD_MB || 20) * 1024 * 1024,
    mediaMaxDimension: Number(env.MEDIA_MAX_DIMENSION || 1920),
    mediaQuality: Number(env.MEDIA_QUALITY || 82),
    contentDir: env.CONTENT_DIR || 'content',
    mediaDir: env.MEDIA_DIR || 'public/media',
    distDir: env.DIST_DIR || 'dist',
    publicDir: env.PUBLIC_DIR || 'public',
    commitMessage: env.COMMIT_MESSAGE || 'Update content via admin portal',
    get adminEnabled() {
      return Boolean(adminPassword)
    },
    get publishEnabled() {
      return Boolean(githubToken && githubRepo)
    },
  }
}
