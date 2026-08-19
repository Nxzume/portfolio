;(async function boot() {
  if (window.__PORTFOLIO_CMS_BOOTED__) return
  window.__PORTFOLIO_CMS_BOOTED__ = true

  const status = document.getElementById('cms-status')
  const origin = window.location.origin
  const host = window.location.hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1'

  try {
    const response = await fetch('/admin/cms-config.yml', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error('Could not load /admin/cms-config.yml (' + response.status + ')')
    }

    const text = await response.text()
    if (text.trim().startsWith('<!')) {
      throw new Error('Got HTML instead of YAML for cms-config.yml.')
    }

    const config = window.jsyaml.load(text)
    if (!config || !config.backend || !Array.isArray(config.collections)) {
      throw new Error('Config YAML is missing backend/collections.')
    }

    config.backend.name = config.backend.name || 'github'
    config.backend.base_url = origin
    config.backend.auth_endpoint = 'api/auth'

    if (isLocal) {
      config.local_backend = true
      config.backend = {
        name: 'proxy',
        proxy_url:
          'http://' + (host === '127.0.0.1' ? '127.0.0.1' : 'localhost') + ':8081/api/v1',
        branch: config.backend.branch || 'master',
      }
    }

    // CVE-2025-57520 affects Decap preview rendering through 3.8.3.
    config.editor = Object.assign({}, config.editor, { preview: false, visualEditing: false })
    config.collections.forEach(function (collection) {
      if (!collection || typeof collection !== 'object') return
      collection.editor = Object.assign({}, collection.editor, {
        preview: false,
        visualEditing: false,
      })
    })

    try {
      const limitResponse = await fetch('/admin/upload-limit.json', { cache: 'no-store' })
      if (limitResponse.ok) {
        const limitData = await limitResponse.json()
        const maxBytes = Number(limitData.maxFileSizeBytes)
        if (maxBytes > 0) applyUploadLimit(config, maxBytes)
      }
    } catch (_) {
      /* keep Decap defaults if the optional limit file is unavailable */
    }

    const seen = new Set()
    config.collections = config.collections.filter(function (collection) {
      if (!collection || !collection.name || seen.has(collection.name)) return false
      seen.add(collection.name)
      return true
    })

    status.remove()
    window.CMS.init({ config: config })
    hideMediaNav()
    new MutationObserver(hideMediaNav).observe(document.body, {
      childList: true,
      subtree: true,
    })
  } catch (error) {
    const heading = document.createElement('h1')
    heading.textContent = 'Editor failed to load'
    const detail = document.createElement('p')
    detail.textContent = error && error.message ? error.message : String(error)
    const hint = document.createElement('p')
    hint.textContent = isLocal
      ? 'Run npm run cms in another terminal, then refresh.'
      : 'Ask the site owner to finish the repository-scoped GitHub App setup.'
    status.replaceChildren(heading, detail, hint)
  }
})()

function hideMediaNav() {
  document.querySelectorAll('a').forEach(function (anchor) {
    const text = (anchor.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()
    if (text !== 'media') return
    const item = anchor.closest('li') || anchor
    item.style.display = 'none'
  })
}

function applyUploadLimit(node, maxBytes) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    node.forEach(function (item) {
      applyUploadLimit(item, maxBytes)
    })
    return
  }
  if (node.widget === 'image' || node.widget === 'file') {
    node.media_library = node.media_library || {}
    node.media_library.config = Object.assign({}, node.media_library.config, {
      max_file_size: maxBytes,
    })
  }
  Object.keys(node).forEach(function (key) {
    applyUploadLimit(node[key], maxBytes)
  })
}