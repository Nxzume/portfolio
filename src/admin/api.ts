/** Thin client for the built-in admin API (server/index.mjs). */

export type MediaItem = { path: string; size: number; modified: string }

export type PublishStatus = {
  state: 'disabled' | 'idle' | 'working' | 'error'
  pending: boolean
  last: { sha: string | null; at: string; message: string; result: string } | null
  error: string | null
}

export type RenderStatus = {
  state: 'idle' | 'working' | 'error'
  lastAt: string | null
  error: string | null
}

export type AdminStatus = {
  repo: string | null
  branch: string
  publish: PublishStatus
  render: RenderStatus
}

export type ContentResponse = {
  files: Record<string, unknown>
  media: MediaItem[]
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new ApiError(res.status, typeof body.error === 'string' ? body.error : `Request failed (${res.status})`)
  }
  return body as T
}

export const api = {
  login: (password: string) =>
    request<{ ok: true }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ ok: true }>('/api/admin/logout', { method: 'POST' }),
  session: () => request<{ ok: true }>('/api/admin/session'),
  content: () => request<ContentResponse>('/api/admin/content'),
  saveFile: (file: string, data: unknown) =>
    request<{ ok: true }>(`/api/admin/content/${encodeURIComponent(file)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  createProject: (slug: string) =>
    request<{ ok: true; file: string }>('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify({ slug }),
    }),
  deleteFile: (file: string) =>
    request<{ ok: true }>(`/api/admin/content/${encodeURIComponent(file)}`, { method: 'DELETE' }),
  uploadMedia: (name: string, data: string) =>
    request<{ ok: true; path: string }>('/api/admin/media', {
      method: 'POST',
      body: JSON.stringify({ name, data }),
    }),
  deleteMedia: (path: string) =>
    request<{ ok: true }>('/api/admin/media', { method: 'DELETE', body: JSON.stringify({ path }) }),
  status: () => request<AdminStatus>('/api/admin/status'),
  publishNow: () => request<{ ok: true; result: string }>('/api/admin/publish', { method: 'POST' }),
}
