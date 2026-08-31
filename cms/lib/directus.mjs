const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://localhost:8055').trim().replace(/\/+$/, '')
const TOKEN = process.env.DIRECTUS_TOKEN?.trim()

export function requireConfig() {
  if (!TOKEN || !DIRECTUS_URL) {
    throw new Error(
      'DIRECTUS_URL and DIRECTUS_TOKEN are required. ' +
        'Add them as GitHub repository secrets (Settings → Secrets → Actions), ' +
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
    // Directus returns 403 (not 404) for a nonexistent collection on the
    // /items endpoint — its error message is deliberately ambiguous
    // ("doesn't exist or no permission") to avoid leaking which collections
    // exist. Treat both as "not accessible" rather than re-throwing.
    if (err.status === 404 || err.status === 403) return false
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
  // Schema API may be forbidden on limited tokens — check content API instead
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
    // /server/info is public and exists on every Directus install regardless
    // of migration state — unlike /items/<collection>, which 403s on a
    // never-migrated instance and would be misdiagnosed as Cloudflare/WAF
    // blocking rather than "this collection doesn't exist yet".
    await publicGet('/server/info')
    console.log('Directus reachable (public API)')
  } catch (err) {
    if (err.isNetworkError) {
      throw new Error(
        `Cannot reach Directus at ${DIRECTUS_URL}.\n` +
          `Network error: ${err.message}\n\n` +
          'Check DIRECTUS_URL is exactly right (no trailing port unless needed, no quotes).',
      )
    }
    if (err.status === 403) {
      throw new Error(
        'Directus returned 403 to this request — without any token.\n\n' +
          'This is NOT a bad token. Something in front of Directus (usually Cloudflare) is blocking this request.\n\n' +
          'Your PC may work because your IP is allowed. GitHub Actions uses different IPs that get blocked.\n\n' +
          'Fix options:\n' +
          '1. Cloudflare → Security → Bots → turn off "Bot Fight Mode" for this CMS domain\n' +
          '   Or add a WAF rule to skip bot checks on it\n' +
          '2. Skip GitHub Actions — run npm run cms:migrate from your machine when cms/ changes\n' +
          '3. Use the Coolify "migrate app" pattern instead (see docs/coolify-deployment.md) — it runs from your own server, so Cloudflare won\'t block it\n' +
          '4. Install a self-hosted GitHub runner on your server (advanced)',
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
        'DIRECTUS_TOKEN is wrong.\n\n' +
          'Sending a bad token causes 403 even when the CMS is public.\n' +
          'Fix:\n' +
          '1. Directus → User Directory → your admin user → Token → Generate Token\n' +
          '2. Copy the full token (no spaces)\n' +
          '3. Update DIRECTUS_TOKEN wherever this is running (GitHub secret, Coolify env var, or your shell)\n' +
          '4. Re-run\n\n' +
          'Tip: use the same token that worked with npm run cms:migrate on your machine.',
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
        `Cannot create "${def.collection}" — token needs Administrator access. ` +
          'Create a new static token on your Directus admin user and update DIRECTUS_TOKEN.',
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
      throw new Error(
        `Cannot create field "${fieldDef.field}" — token needs Administrator access. ` +
          `Or add the field manually in Directus → Settings → Data Model → ${collection}.`,
      )
    }
    throw err
  }
}

export async function removeField(collection, field) {
  try {
    await api(`/fields/${collection}/${field}`, 'DELETE')
    console.log(`Removed field: ${collection}.${field}`)
  } catch (err) {
    if (err.status === 404) {
      console.log(`Field already removed: ${collection}.${field}`)
      return
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
