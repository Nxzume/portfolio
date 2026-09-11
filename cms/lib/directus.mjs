/**
 * Directus API helpers shared by cms/migrate.mjs.
 */
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
    if (msg.includes('already exists') || msg.includes('duplicate')) {
      console.log(`Field exists: ${collection}.${fieldDef.field}`)
      return
    }
    // Do not treat every 400 as success — that hid real schema errors.
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

function isDuplicateError(err) {
  const msg = JSON.stringify(err.body ?? err.message).toLowerCase()
  return (
    msg.includes('already exists') ||
    msg.includes('duplicate') ||
    msg.includes('unique') ||
    msg.includes('already has an associated relationship')
  )
}

async function getRelation(collection, field) {
  // Prefer the direct endpoint — list filters can miss system/file relations.
  try {
    const res = await api(`/relations/${encodeURIComponent(collection)}/${encodeURIComponent(field)}`, 'GET')
    if (res.data) return res.data
  } catch (err) {
    if (err.status && err.status !== 404) {
      // keep trying the list filter below
    }
  }

  const q = new URLSearchParams({
    'filter[collection][_eq]': collection,
    'filter[field][_eq]': field,
    limit: '5',
  })
  const existing = await api(`/relations?${q}`, 'GET')
  return existing.data?.[0] ?? null
}

async function deleteRelation(collection, field) {
  try {
    await api(`/relations/${encodeURIComponent(collection)}/${encodeURIComponent(field)}`, 'DELETE')
    console.log(`Removed relation: ${collection}.${field}`)
  } catch (err) {
    if (err.status === 404) return
    // "Doesn't have a relationship" (400) happens when GET /relations
    // reports a phantom/system relation (e.g. an implied link to
    // directus_folders on a fresh file field) that the DELETE endpoint
    // doesn't actually recognize as a real, deletable relation. Nothing to
    // delete in that case — safe to treat like a 404 and let the caller
    // proceed to create the real relation.
    const msg = JSON.stringify(err.body ?? err.message)
    if (err.status === 400 && msg.includes("doesn't have a relationship")) {
      console.log(`No real relation to remove: ${collection}.${field} (was a phantom/system relation)`)
      return
    }
    // Some Directus versions only support delete by id
    const existing = await getRelation(collection, field)
    if (existing?.id != null) {
      await api(`/relations/${existing.id}`, 'DELETE')
      console.log(`Removed relation id=${existing.id}: ${collection}.${field}`)
      return
    }
    throw err
  }
}

/**
 * Ensure a M2O relation from collection.field → directus_files.
 * Without this relation, Directus hides Upload / Import URL and only shows
 * "Choose File from Library" (createAllowed stays false).
 *
 * Also repairs wrong targets (we've seen fields linked to directus_users).
 */
export async function ensureFileRelation(collection, field) {
  const existing = await getRelation(collection, field)
  if (existing?.related_collection === 'directus_files') {
    console.log(`Relation exists: ${collection}.${field} → directus_files`)
    return existing
  }

  if (existing && existing.related_collection && existing.related_collection !== 'directus_files') {
    console.log(
      `Wrong relation ${collection}.${field} → ${existing.related_collection}; recreating → directus_files`,
    )
    await deleteRelation(collection, field)
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
      schema: { on_delete: 'SET NULL' },
    })
  } catch (err) {
    if (isDuplicateError(err)) {
      const again = await getRelation(collection, field)
      if (again?.related_collection === 'directus_files') {
        console.log(`Relation exists: ${collection}.${field} → directus_files`)
        return again
      }
      if (again && again.related_collection !== 'directus_files') {
        await deleteRelation(collection, field)
        await api('/relations', 'POST', {
          collection,
          field,
          related_collection: 'directus_files',
          meta: {
            one_field: null,
            sort_field: null,
            one_deselect_action: 'nullify',
          },
          schema: { on_delete: 'SET NULL' },
        })
      } else if (!again) {
        // Directus says associated but GET is empty — trust Directus only if
        // we can't inspect; still try one more GET after a no-op.
        console.log(`Relation already associated in Directus: ${collection}.${field}`)
        return { collection, field, related_collection: 'directus_files' }
      }
    } else {
      throw new Error(
        `Failed creating relation ${collection}.${field} → directus_files: ${err.message}`,
      )
    }
  }

  const verified = await getRelation(collection, field)
  if (verified?.related_collection === 'directus_files') {
    console.log(`Created relation: ${collection}.${field} → directus_files`)
    return verified
  }
  if (verified && verified.related_collection !== 'directus_files') {
    throw new Error(
      `Relation ${collection}.${field} still points at ${verified.related_collection}, expected directus_files`,
    )
  }
  console.log(`Created relation: ${collection}.${field} → directus_files`)
  return { collection, field, related_collection: 'directus_files' }
}

/**
 * projects.gallery was partially migrated (meta left behind, DB column gone),
 * which makes GET /items/projects 500. Drop the broken field so we can recreate
 * it as a proper Files (M2M) alias.
 */
export async function repairBrokenProjectsGalleryField() {
  const field = await getField('projects', 'gallery')
  if (!field) {
    console.log('projects.gallery absent — will create Files field later')
    return
  }

  // Alias Files fields are fine once junction exists; anything else (json /
  // orphaned column meta) breaks item reads.
  if (field.type === 'alias' && (field.meta?.special || []).includes?.('files')) {
    // Probe whether items can be read; if gallery meta is corrupt, drop it.
    try {
      await api('/items/projects?limit=1&fields=id', 'GET')
      console.log('projects.gallery Files alias present')
      return
    } catch (err) {
      console.warn(`projects.gallery alias looks broken (${err.message}); recreating`)
    }
  } else {
    console.log(`Removing broken projects.gallery (type=${field.type})…`)
  }

  await removeField('projects', 'gallery')
}

/** Same for projects.sections JSON leftovers before O2M is ready. */
export async function repairBrokenProjectsSectionsField() {
  const field = await getField('projects', 'sections')
  if (!field) return
  if (field.type === 'alias' && (field.meta?.special || []).includes?.('o2m')) {
    console.log('projects.sections O2M alias present')
    return
  }
  // Keep JSON until migrateProjectSectionsToO2M copies values — but if the
  // column is already gone, drop meta so item reads work.
  try {
    await api('/items/projects?limit=1&fields=id,sections', 'GET')
  } catch (err) {
    const msg = String(err.message || '')
    if (msg.includes('sections') && msg.includes('does not exist')) {
      console.log('Removing broken projects.sections field meta…')
      await removeField('projects', 'sections')
    }
  }
}

/**
 * Force file-field meta/schema/relation into the shape Directus expects for a
 * working upload + library picker (uuid + special:file + relation).
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
        is_nullable: true,
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
    await api(`/fields/${collection}`, 'POST', {
      ...fieldDef,
      schema: { is_nullable: true, ...(fieldDef.schema || {}) },
    })
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
    if (!specialOk || !interfaceOk || existing.meta?.interface === 'input') {
      try {
        await api(`/fields/${collection}/${fieldDef.field}`, 'PATCH', {
          meta: fieldDef.meta,
          schema: { is_nullable: true },
        })
        console.log(`Updated file field meta: ${collection}.${fieldDef.field}`)
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

/**
 * Ensure projects.gallery is a real Files (M2M) field — JSON list + file-image
 * cannot upload (Directus treats file interfaces as relational).
 */
export async function ensureProjectGalleryFilesField() {
  const collection = 'projects'
  const field = 'gallery'
  const junction = 'projects_gallery'
  const existing = await getField(collection, field)

  if (existing?.type === 'json') {
    console.log('projects.gallery is JSON — converting to Files (M2M)…')
    // Caller should have migrated values first; drop JSON field then recreate.
    await removeField(collection, field)
  } else if (existing && existing.type === 'alias') {
    // Do NOT return early here. The alias field existing only means the
    // *field* was created at some point — it says nothing about whether the
    // junction collection/fields/relations actually exist. They can be
    // missing (confirmed: found a real instance where the field existed but
    // zero relation records did), which breaks every read of `projects`
    // that expands `gallery` — i.e. every site build. Fall through so the
    // idempotent ensure* calls below can verify and repair them.
    console.log('projects.gallery Files field exists — verifying junction/relations…')
  }

  if (!(await collectionExists(junction))) {
    await api('/collections', 'POST', {
      collection: junction,
      meta: { hidden: true, icon: 'import_export' },
      schema: {},
      fields: [
        {
          field: 'id',
          type: 'integer',
          meta: { hidden: true, interface: 'input' },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
      ],
    })
    console.log(`Created junction collection: ${junction}`)
  }

  // Junction columns
  await ensureField(junction, {
    field: 'projects_id',
    type: 'integer',
    meta: { hidden: true, interface: 'select-dropdown-m2o' },
    schema: { is_nullable: true },
  })
  await ensureField(junction, {
    field: 'directus_files_id',
    type: 'uuid',
    meta: { hidden: true, interface: 'select-dropdown-m2o', special: ['file'] },
    schema: { is_nullable: true },
  })
  await ensureField(junction, {
    field: 'sort',
    type: 'integer',
    meta: { hidden: true, interface: 'input' },
    schema: { is_nullable: true },
  })

  // Alias field on projects
  const galleryField = await getField(collection, field)
  if (!galleryField) {
    await api(`/fields/${collection}`, 'POST', {
      field,
      type: 'alias',
      meta: {
        interface: 'files',
        special: ['files'],
        options: { folder: null, enableCreate: true, enableSelect: true },
        note: 'Project gallery — upload or pick from File Library',
      },
    })
    console.log('Created projects.gallery Files field')
  }

  // Relations: projects ↔ junction ↔ files
  //
  // NOT gated behind a "does it already exist" pre-check via getRelation().
  // Confirmed by direct testing: getRelation()'s list-filter fallback query
  // doesn't actually filter (Directus's /relations list endpoint doesn't
  // honour filter[collection][_eq]/filter[field][_eq] the way /items/:x
  // does) — it returns the first relation in the ENTIRE system relations
  // list, which is always truthy, so the "already exists" check always
  // reports true even when nothing exists for this collection/field at
  // all. That silently skipped relation creation forever, which is why
  // querying projects with fields=* crashed on every read (Directus
  // treats an alias field with no real relation as a raw, nonexistent
  // column). Always attempting the POST and treating "already exists" as
  // success (via isDuplicateError, below) is correct either way and does
  // not depend on that broken check.
  async function ensureRel(payload, label) {
    try {
      await api('/relations', 'POST', payload)
      console.log(`Created relation: ${label}`)
    } catch (err) {
      if (isDuplicateError(err)) {
        console.log(`Relation already exists: ${label}`)
        return
      }
      throw err
    }
  }

  await ensureRel(
    {
      collection: junction,
      field: 'projects_id',
      related_collection: 'projects',
      meta: {
        one_field: field,
        sort_field: 'sort',
        one_deselect_action: 'nullify',
        junction_field: 'directus_files_id',
      },
      schema: { on_delete: 'SET NULL' },
    },
    `${junction}.projects_id → projects`,
  )

  await ensureRel(
    {
      collection: junction,
      field: 'directus_files_id',
      related_collection: 'directus_files',
      meta: {
        one_field: null,
        sort_field: null,
        one_deselect_action: 'nullify',
        junction_field: 'projects_id',
      },
      schema: { on_delete: 'SET NULL' },
    },
    `${junction}.directus_files_id → directus_files`,
  )

  // No separate relation for projects.gallery itself — it's an alias field
  // (no real column, confirmed: schema is null) and doesn't get its own
  // relation row. The junction's projects_id relation above, with
  // meta.one_field: 'gallery', is what fully establishes the M2M in both
  // directions. A prior version of this code also tried to create a third,
  // separate relation from projects.gallery -> the junction collection —
  // that's redundant, and Directus tried to add a real foreign key
  // constraint on gallery for it despite schema: null, which fails outright
  // since gallery has no backing column ("column gallery referenced in
  // foreign key constraint does not exist"). Confirmed removing it entirely
  // still leaves the M2M fully functional (see cms/lib/directus.mjs commit
  // history / diagnostic notes if this needs revisiting).

  return { junction }
}

/** O2M project_sections with a real file-image field (JSON list cannot host file uploads). */
export async function ensureProjectSectionsCollection() {
  const collection = 'project_sections'

  await ensureCollection({
    collection,
    meta: {
      icon: 'segment',
      sort_field: 'sort',
      note: 'Detail sections for each project',
      display_template: '{{title}}',
    },
    schema: {},
    fields: [
      {
        field: 'id',
        type: 'integer',
        meta: { hidden: true, interface: 'input' },
        schema: { is_primary_key: true, has_auto_increment: true },
      },
    ],
  })

  await ensureField(collection, {
    field: 'project',
    type: 'integer',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      required: true,
      options: { template: '{{title}}' },
    },
    schema: { is_nullable: false },
  })
  await ensureField(collection, {
    field: 'sort',
    type: 'integer',
    meta: { interface: 'input', hidden: true },
  })
  await ensureField(collection, stringLike('section_id', 'Section ID used in anchors'))
  await ensureField(collection, stringLike('title', 'Section title'))
  await ensureFileField(collection, {
    field: 'image',
    type: 'uuid',
    meta: {
      interface: 'file-image',
      special: ['file'],
      width: 'half',
      note: 'Section image',
      options: { folder: null, enableCreate: true, enableSelect: true },
    },
    schema: { is_nullable: true },
  })
  await ensureField(collection, stringLike('image_alt', 'Image alt text'))
  await ensureField(collection, {
    field: 'quote',
    type: 'text',
    meta: { interface: 'input-multiline', width: 'full', note: 'Optional quote' },
  })
  await ensureField(collection, {
    field: 'paragraphs',
    type: 'json',
    meta: {
      interface: 'list',
      width: 'full',
      options: {
        template: '{{paragraph}}',
        fields: [
          {
            field: 'paragraph',
            name: 'Paragraph',
            type: 'text',
            meta: { interface: 'input-multiline', width: 'full' },
          },
        ],
      },
    },
  })

  // Relation project_sections.project → projects
  //
  // Not gated behind getRelation() — same broken-filter issue as ensureRel
  // above. Always attempt the create; isDuplicateError handles "already
  // exists" as success.
  try {
    await api('/relations', 'POST', {
      collection,
      field: 'project',
      related_collection: 'projects',
      meta: {
        one_field: 'sections',
        sort_field: 'sort',
        one_deselect_action: 'nullify',
      },
      schema: { on_delete: 'CASCADE' },
    })
    console.log('Created relation: project_sections.project → projects')
  } catch (err) {
    if (isDuplicateError(err)) {
      console.log('Relation already exists: project_sections.project → projects')
    } else {
      throw err
    }
  }

  // Alias O2M on projects
  const sectionsField = await getField('projects', 'sections')
  if (sectionsField?.type === 'json') {
    console.log('projects.sections is JSON — will migrate then replace with O2M alias')
    return { needsJsonMigration: true }
  }
  if (!sectionsField) {
    await api('/fields/projects', 'POST', {
      field: 'sections',
      type: 'alias',
      meta: {
        interface: 'list-o2m',
        special: ['o2m'],
        options: {
          template: '{{title}}',
          enableCreate: true,
          enableSelect: true,
        },
        note: 'Project detail sections',
      },
    })
    console.log('Created projects.sections O2M alias')
  }

  // Ensure one-side relation meta points at sections
  await ensureFileRelation(collection, 'image')
  return { needsJsonMigration: false }
}

function stringLike(field, note) {
  return {
    field,
    type: 'string',
    meta: { interface: 'input', width: 'full', ...(note ? { note } : {}) },
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

/** Fail migrate loudly if Upload would still be hidden in the Data Studio. */
export async function assertFileRelations(fields) {
  const missing = []
  const wrong = []
  for (const { collection, field } of fields) {
    try {
      const rel = await ensureFileRelation(collection, field)
      if (rel?.related_collection && rel.related_collection !== 'directus_files') {
        wrong.push(`${collection}.${field}→${rel.related_collection}`)
      }
    } catch (err) {
      missing.push(`${collection}.${field} (${err.message})`)
    }
  }
  if (missing.length || wrong.length) {
    throw new Error(
      [
        missing.length ? `File relations missing: ${missing.join(', ')}` : null,
        wrong.length ? `File relations wrong target: ${wrong.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' | '),
    )
  }
  console.log(`Verified ${fields.length} file relation(s) → directus_files`)
}
