const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://localhost:8055').trim().replace(/\/+$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN?.trim()

export function requireConfig() {
  if (!TOKEN || !DIRECTUS_URL) {
    throw new Error(
      'DIRECTUS_URL and DIRECTUS_TOKEN are required. ' +
        'Add them to the Coolify migrate app env vars, ' +
        'or export them locally before running npm run cms:migrate.',
    )
  }
  return { url: DIRECTUS_URL, token: TOKEN }
}

export async function api(path, method, body) {
  const { url, token } = requireConfig()
  let res
  try {
    res = await fetch(`${url}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    const networkErr = new Error(`Network error calling ${url}${path}: ${err.message}`)
    networkErr.isNetworkError = true
    throw networkErr
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`)
    err.status = res.status
    err.body = json
    throw err
  }
  return json
}

export async function itemsAccessible(name) {
  try {
    await api(`/items/${name}`, 'GET')
    return true
  } catch (err) {
    if (err.status === 404) return false
    throw err
  }
}

export async function collectionExists(name) {
  try {
    await api(`/collections/${name}`, 'GET')
    return true
  } catch (err) {
    if (err.status === 404) return false
  }
  return itemsAccessible(name)
}

async function publicGet(path) {
  let res
  try {
    res = await fetch(`${DIRECTUS_URL}${path}`, {
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const networkErr = new Error(`Network error calling ${DIRECTUS_URL}${path}: ${err.message}`)
    networkErr.isNetworkError = true
    throw networkErr
  }
  if (!res.ok) {
    const err = new Error(`GET ${path} -> ${res.status}`)
    err.status = res.status
    throw err
  }
}

/** Verify CMS is reachable and the admin token works. */
export async function verifyToken() {
  console.log(`Directus URL: ${DIRECTUS_URL}`)

  try {
    await publicGet('/items/portfolio_globals')
    console.log('Directus reachable (public API)')
  } catch (err) {
    if (err.isNetworkError) {
      throw new Error(
        `Cannot reach Directus at ${DIRECTUS_URL}.\n` +
          `Network error: ${err.message}\n\n` +
          'Check DIRECTUS_URL is exactly https://cms.alexandreguichet.vancouverly.ca (no :8055, no quotes).',
      )
    }
    if (err.status === 403) {
      throw new Error(
        'Directus returned 403 on the public API.\n\n' +
          'If running from GitHub Actions, Cloudflare may be blocking GitHub IPs — use the Coolify migrate app instead.\n' +
          'If running from Coolify, redeploy after granting public read (this script does that automatically).',
      )
    }
    throw new Error(`Directus returned ${err.status} on public API — check the URL and public read permissions.`)
  }

  try {
    await api('/collections', 'GET')
    console.log('Admin token verified')
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      throw new Error(
        'DIRECTUS_TOKEN is wrong or lacks Administrator access.\n\n' +
          'Fix:\n' +
          '1. Directus → User Directory → admin user → Token → Generate Token\n' +
          '2. Update DIRECTUS_TOKEN on the Coolify migrate app\n' +
          '3. Redeploy the migrate app',
      )
    }
    throw err
  }
}

export async function ensureCollection(def) {
  if (await collectionExists(def.collection)) {
    console.log(`Collection exists: ${def.collection}`)
    return
  }
  console.log(`Creating collection: ${def.collection}`)
  try {
    await api('/collections', 'POST', def)
  } catch (err) {
    if (err.status === 403) {
      throw new Error(
        `Cannot create "${def.collection}" — token needs Administrator access.`,
      )
    }
    throw err
  }
}

export async function ensureField(collection, fieldDef) {
  try {
    await api(`/fields/${collection}`, 'POST', fieldDef)
    console.log(`Created field: ${collection}.${fieldDef.field}`)
  } catch (err) {
    const msg = JSON.stringify(err.body ?? err.message)
    if (msg.includes('already exists') || msg.includes('duplicate') || err.status === 400) {
      console.log(`Field exists: ${collection}.${fieldDef.field}`)
      return
    }
    if (err.status === 403) {
      throw new Error(`Cannot create field "${fieldDef.field}" — token needs Administrator access.`)
    }
    throw err
  }
}

export async function grantPublicRead(collection) {
  const policiesRes = await api('/policies?filter[name][_eq]=$t:public_label', 'GET')
  const publicPolicy = policiesRes.data?.[0]
  if (!publicPolicy) throw new Error('Could not find the Public policy')

  const existing = await api(
    `/permissions?filter[policy][_eq]=${publicPolicy.id}&filter[collection][_eq]=${collection}&filter[action][_eq]=read`,
    'GET',
  )
  if (existing.data?.length > 0) {
    console.log(`Public read already granted: ${collection}`)
    return
  }

  await api('/permissions', 'POST', {
    collection,
    action: 'read',
    policy: publicPolicy.id,
    fields: ['*'],
    permissions: {},
    validation: {},
  })
  console.log(`Granted public read: ${collection}`)
}
