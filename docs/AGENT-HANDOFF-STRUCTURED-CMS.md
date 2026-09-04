# Agent handoff — structured Directus CMS for `Nxzume/portfolio`

> **Done.** This was completed and merged to `master` — Directus now uses
> structured form fields (`site_settings`, `hero`, `about`, `projects`,
> etc. — see `cms/lib/schema.mjs`) instead of JSON blobs. Kept here as a
> historical record of the original spec, not a pending task list. The
> `docs/structured-cms-bundle/` folder this doc references has been
> removed — its contents are the real `cms/`, `scripts/`, and
> `src/content/content-map.test.mjs` files now, already in place.

Give this document to an agent with **write access** to `https://github.com/Nxzume/portfolio`.

**Do not** put these files in `vancouverly-site`. Everything below belongs in the **portfolio** repo only.

---

## Goal

Replace JSON-blob Directus fields (`portfolio_globals.site`, `projects.payload`, etc.) with **normal form fields** (text inputs, repeaters). The live site still builds from `content/*.json`; only the CMS layer and fetch script change.

**Client domains (already deployed):**

| Resource | URL |
|----------|-----|
| Site | `https://alexandreguichet.vancouverly.ca` |
| CMS | `https://alexandreguichet-cms.vancouverly.ca` |

---

## What the agent must do (checklist)

1. Clone `Nxzume/portfolio`, branch off **`master`**
2. Add / replace every file listed in [File manifest](#file-manifest)
3. Run: `npm ci && npm run lint && npm run typecheck && npm test && npm run build`
4. Commit and push branch → open PR → merge to **`master`**
5. Tell the user to re-run Coolify migrate (see [After merge — Coolify](#after-merge--coolify))
6. Tell the user to redeploy the site app in Coolify

**Suggested branch name:** `structured-cms-directus`  
**Suggested commit message:** `Replace JSON blob CMS fields with structured Directus forms`

---

## File manifest

| Action | Path |
|--------|------|
| **Create** | `cms/lib/schema.mjs` |
| **Create** | `cms/lib/content-map.mjs` |
| **Create** | `cms/lib/directus.mjs` |
| **Create** | `cms/migrate.mjs` |
| **Create** | `cms/Dockerfile` |
| **Create** | `cms/entrypoint.sh` |
| **Replace** | `scripts/fetch-cms-content.mjs` |
| **Replace** | `cms/apply-schema.mjs` (deprecate → exit with message) |
| **Replace** | `cms/seed-content.mjs` (deprecate → exit with message) |
| **Replace** | `cms/grant-public-read.mjs` (deprecate → exit with message) |
| **Modify** | `package.json` — add `"cms:migrate": "node cms/migrate.mjs"` |
| **Create** | `src/content/content-map.test.ts` |
| **Create** | `.github/workflows/coolify-migrate-deploy.yml` (optional) |
| **Create** | `docs/setup-guide.md` (optional but recommended) |
| **Update** | `docs/coolify-deployment.md` |
| **Update** | `README.md` — Directus schema section |

**Do not change:** React components, `src/content/normalize.ts`, `Dockerfile` (site), or `content/*.json` committed files.

---

## New Directus collections (after migrate runs)

| Collection | Type | Editable fields |
|------------|------|-----------------|
| `site_settings` | singleton | name, tagline, email, url, github, linkedin |
| `hero` | singleton | headline, image path, CTA labels/hrefs |
| `about` | singleton | portrait, lead, body (repeater), note |
| `contact` | singleton | eyebrow, title, lede, email_button_text |
| `score_section` | singleton | eyebrow, title, lede |
| `projects_section` | singleton | eyebrow, title, lede |
| `focus_tabs` | collection | tab_id, label, headline, body, sort |
| `sketch_tracks` | collection | track_id, title, mood, audio, bpm, base_freq, sort |
| `projects` | collection | slug, title, subtitle, summary, image, gallery, highlights, links, intro, sections |

`cms/migrate.mjs` is **idempotent** and automatically:

- Creates missing collections/fields
- Migrates existing `portfolio_globals` JSON → structured collections
- Migrates existing `projects.payload` JSON → structured project fields
- Removes legacy JSON fields
- Grants public read on all collections

---

## `package.json` change

Add to `"scripts"`:

```json
"cms:migrate": "node cms/migrate.mjs"
```

---

## Deprecate old scripts

Replace `cms/apply-schema.mjs`, `cms/seed-content.mjs`, and `cms/grant-public-read.mjs` with:

```javascript
/**
 * @deprecated Use npm run cms:migrate instead.
 */
console.log('<script-name> is deprecated — run: npm run cms:migrate')
process.exit(1)
```

(Use the actual script name in the message.)

---

## After merge — Coolify

### 1. Update migrate compose command

Stop using `apply-schema.mjs`. Use:

```yaml
services:
  migrate:
    image: node:22-alpine
    environment:
      - DIRECTUS_URL=https://alexandreguichet-cms.vancouverly.ca
      - DIRECTUS_TOKEN=${DIRECTUS_TOKEN}
    command:
      - sh
      - -c
      - |
        set -e
        apk add --no-cache git
        rm -rf /app
        git clone --depth 1 https://github.com/Nxzume/portfolio.git /app
        cd /app
        node cms/migrate.mjs
        echo "CMS migrate done."
        sleep infinity
```

Env var key must be exactly `DIRECTUS_TOKEN` (no `{}`, no quotes). Paste token only.

**Success logs:**

```
Migrating legacy portfolio_globals → structured collections…
CMS migrate done.
```

### 2. Redeploy site app

Build-time env (unchanged):

```
DIRECTUS_URL=https://alexandreguichet-cms.vancouverly.ca
```

Build log should show: `Wrote 8 global file(s) and 2 project(s).`

---

## Verification

1. Directus sidebar shows **Site Settings**, **Hero**, **About**, **Projects** — not JSON code blocks
2. `https://alexandreguichet-cms.vancouverly.ca/items/site_settings` returns JSON (incognito)
3. Site loads at `https://alexandreguichet.vancouverly.ca`
4. `npm test` passes (44 tests including 4 new content-map tests)

---

## Implementation source (easiest path)

The implementing agent should add **`docs/structured-cms-bundle/`** to the repo (all files listed below), then copy into place:

```bash
# From portfolio repo root, after adding docs/structured-cms-bundle/
cp -r docs/structured-cms-bundle/cms ./cms
cp docs/structured-cms-bundle/scripts/fetch-cms-content.mjs scripts/fetch-cms-content.mjs
cp docs/structured-cms-bundle/src/content/content-map.test.ts src/content/content-map.test.ts
cp docs/structured-cms-bundle/.github/workflows/coolify-migrate-deploy.yml .github/workflows/coolify-migrate-deploy.yml
cp docs/structured-cms-bundle/setup-guide.md docs/setup-guide.md
cp docs/structured-cms-bundle/coolify-deployment.md docs/coolify-deployment.md
```

Merge `docs/structured-cms-bundle/README.snippet.md` into `README.md` (Directus schema section).

Add to `package.json` scripts (see `docs/structured-cms-bundle/package-scripts.json` for reference):

```json
"cms:migrate": "node cms/migrate.mjs"
```

### Bundle file tree

```
docs/structured-cms-bundle/
├── cms/
│   ├── lib/content-map.mjs
│   ├── lib/directus.mjs
│   ├── lib/schema.mjs
│   ├── migrate.mjs
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── apply-schema.mjs      (deprecated stub)
│   ├── seed-content.mjs      (deprecated stub)
│   └── grant-public-read.mjs (deprecated stub)
├── scripts/fetch-cms-content.mjs
├── src/content/content-map.test.ts
├── .github/workflows/coolify-migrate-deploy.yml
├── setup-guide.md
├── coolify-deployment.md
├── README.snippet.md
└── package-scripts.json
```

If the bundle directory is not available, recreate every file from the appendices below (same content as bundle).

---

## What NOT to do

- Do not add portfolio CMS files to `vancouverly-site`
- Do not run `apply-schema.mjs` on an instance where `portfolio_globals` already exists (not idempotent)
- Do not use nested CMS URL `cms.alexandreguichet.vancouverly.ca` — use flat `alexandreguichet-cms.vancouverly.ca` (single-level wildcard)
