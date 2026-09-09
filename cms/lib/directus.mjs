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
    // Directus returns 403 (not 404) for a nonexistent collection on the
    // /items endpoint — deliberately ambiguous ("doesn't exist or no
    // permission") to avoid leaking which collections exist. Treat both as
    // "not accessible" rather than re-throwing.
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
    // never-migrated instance (site_settings doesn't exist yet) and would be
    // misdiagnosed as Cloudflare/WAF blocking rather than "this collection
    // doesn't exist yet". Confirmed by testing against a genuinely fresh
    // instance: the old check failed every first-time bootstrap.
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

export async function getField(collection, field) {
  try {
    const res = await api(`/fields/${collection}/${field}`, 'GET')
    return res.data ?? null
  } catch (err) {
    if (err.status === 404 || err.status === 403) return null
    throw err
  }
}

export async function removeField(collection, field) {
  try {
    await api(`/fields/${collection}/${field}`, 'DELETE')
    console.log(`Removed field: ${collection}.${field}`)
  } catch (err) {
    // Same 403-vs-404 ambiguity as itemsAccessible — a field on a
    // nonexistent collection (e.g. cleaning up legacy portfolio_globals
    // fields on an instance that never had that collection) can 403.
    if (err.status === 404 || err.status === 403) {
      console.log(`Field already removed (or collection doesn't exist): ${collection}.${field}`)
      return
    }
    throw err
  }
}

/** Ensure a M2O relation from collection.field → directus_files. */
export async function ensureFileRelation(collection, field) {
  const existing = await api(
    `/relations?filter[collection][_eq]=${collection}&filter[field][_eq]=${field}`,
    'GET',
  )
  if (existing.data?.length) {
    console.log(`Relation exists: ${collection}.${field} → directus_files`)
    return
  }
  try {
    await api('/relations', 'POST', {
      collection,
      field,
      related_collection: 'directus_files',
      meta: {
        one_field: null,
        sort_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        on_delete: 'SET NULL',
        foreign_key_table: 'directus_files',
        foreign_key_column: 'id',
      },
    })
    console.log(`Created relation: ${collection}.${field} → directus_files`)
  } catch (err) {
    const msg = JSON.stringify(err.body ?? err.message)
    if (msg.includes('already exists') || msg.includes('duplicate') || err.status === 400) {
      console.log(`Relation already present: ${collection}.${field}`)
      return
    }
    throw err
  }
}

/**
 * Force file-field meta/schema/relation into the shape Directus expects for a
 * working upload + library picker (uuid + special:file + FK to directus_files).
 */
export async function repairFileField(collection, fieldDef) {
  const existing = await getField(collection, fieldDef.field)
  if (!existing) {
    return ensureFileField(collection, fieldDef)
  }

  if (existing.type !== 'uuid') {
    return ensureFileField(collection, fieldDef)
  }

  try {
    await api(`/fields/${collection}/${fieldDef.field}`, 'PATCH', {
      meta: fieldDef.meta,
      schema: {
        ...(existing.schema || {}),
        ...(fieldDef.schema || {}),
        is_nullable: true,
        foreign_key_table: 'directus_files',
        foreign_key_column: 'id',
      },
    })
    console.log(`Repaired file field: ${collection}.${fieldDef.field}`)
  } catch (err) {
    console.warn(`Could not repair ${collection}.${fieldDef.field}: ${err.message}`)
  }

  await ensureFileRelation(collection, fieldDef.field)
  return { needsPathMigration: false }
}

/**
 * Ensure a uuid file field exists. If a legacy string field is present,
 * returns { needsPathMigration: true } so the caller can convert values.
 */
export async function ensureFileField(collection, fieldDef) {
  const existing = await getField(collection, fieldDef.field)
  if (!existing) {
    await api(`/fields/${collection}`, 'POST', fieldDef)
    console.log(`Created file field: ${collection}.${fieldDef.field}`)
    await ensureFileRelation(collection, fieldDef.field)
    return { needsPathMigration: false }
  }

  if (existing.type === 'uuid') {
    console.log(`File field exists: ${collection}.${fieldDef.field}`)
    await ensureFileRelation(collection, fieldDef.field)
    const special = existing.meta?.special
    const specialOk = Array.isArray(special)
      ? special.includes('file')
      : String(special || '').includes('file')
    const interfaceOk =
      existing.meta?.interface === 'file' || existing.meta?.interface === 'file-image'
    const fkOk = existing.schema?.foreign_key_table === 'directus_files'
    if (!specialOk || !interfaceOk || !fkOk || existing.meta?.interface === 'input') {
      try {
        await api(`/fields/${collection}/${fieldDef.field}`, 'PATCH', {
          meta: fieldDef.meta,
          schema: {
            ...(existing.schema || {}),
            ...(fieldDef.schema || {}),
            is_nullable: true,
            foreign_key_table: 'directus_files',
            foreign_key_column: 'id',
          },
        })
        console.log(`Updated file field meta/schema: ${collection}.${fieldDef.field}`)
      } catch (err) {
        console.log(`Could not patch field meta ${collection}.${fieldDef.field}: ${err.message}`)
      }
    }
    return { needsPathMigration: false }
  }

  if (existing.type === 'string') {
    console.log(`Legacy string media field: ${collection}.${fieldDef.field} — will convert to file`)
    return { needsPathMigration: true, existing }
  }

  console.log(`Unexpected type for ${collection}.${fieldDef.field}: ${existing.type}`)
  return { needsPathMigration: false }
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
