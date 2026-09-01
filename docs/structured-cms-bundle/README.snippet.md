# Alexandre Guichet — Portfolio

Interactive portfolio for **Alexandre Guichet**: game composition, level design, and Azure DevOps.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

Checks:

```bash
npm run lint
npm run typecheck
npm test
```

## Content

Content lives in `content/*.json` and `content/projects/*.json` — but these
files are **generated at build time** from Directus, not hand-edited or
committed here. `npm run build` runs `scripts/fetch-cms-content.mjs` first,
which pulls the current published content and writes it into those files.

**To edit content:** log into the Directus admin for this site (see
[`docs/setup-guide.md`](docs/setup-guide.md) for full Coolify setup), edit
`portfolio_globals` or `projects`, save. Then trigger a rebuild of this app
in Coolify — the next build pulls the new content. Content is fetched at
**build time**, not at page load, so publishing a change doesn't show up until
the next build — that trade-off buys prerendered static HTML for every page
(real `<title>`, description, and Open Graph tags per project, fast first
paint, good SEO).

Required env for the build (Coolify build-time var):

```env
DIRECTUS_URL=https://alexandreguichet-cms.vancouverly.ca
```

If unset, the fetch step is skipped and the build uses whatever is already
in `content/` — useful for local development without a CMS running.

Images and audio still live in `public/images/` and `public/audio/` —
Directus stores image fields as plain path strings pointing at files
already in those folders, so uploading new media is a separate step (add
the file to `public/`, then reference its path from the Directus admin).

## Directus schema

Structured collections with normal form fields (not raw JSON):

| Collection | What you edit |
|------------|----------------|
| `site_settings` | Name, tagline, email, site URL, GitHub, LinkedIn |
| `hero` | Headline, image path, CTA buttons |
| `about` | Portrait, lead, body paragraphs (list), note |
| `contact` | Section copy + email button label |
| `score_section` | Music section header |
| `projects_section` | Projects section header |
| `focus_tabs` | Compose / Levels / Azure tabs |
| `sketch_tracks` | Audio tracks on the score desk |
| `projects` | Each project — title, summary, gallery, sections, etc. |

Bootstrap or upgrade the CMS:

```powershell
$env:DIRECTUS_URL = "https://alexandreguichet-cms.vancouverly.ca"
$env:DIRECTUS_TOKEN = "your_admin_token"
npm run cms:migrate
```

Migrate is idempotent — safe to re-run. It converts legacy JSON-blob fields into
structured forms automatically.

## How pages are built

`npm run build` does four things:

1. `scripts/fetch-cms-content.mjs` — pulls published content from Directus.
2. `vite build` — the client bundle.
3. `vite build --ssr` — a server bundle from `src/entry-server.tsx`.
4. `scripts/prerender.mjs` — renders the homepage, every project page, and
   the 404 to static HTML, then writes `sitemap.xml` and `robots.txt`.

Each page ships with its own `<title>`, description, canonical URL, and
Open Graph tags. Adding a project in Directus adds a prerendered page
automatically on the next build — no build config to touch.

## Stack

Vite, React, TypeScript, Framer Motion, React Router, Directus. Vitest for
tests, oxlint for linting.
