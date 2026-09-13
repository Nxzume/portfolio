# Alexandre Guichet — Portfolio

Portfolio for **Alexandre Guichet** — Python & C++ software engineer
(Technical Lead at Microsoft), game composer, and level designer.

One Docker container serves the whole thing: the prerendered static site, the
media library, and a built-in admin portal at `/admin`. No database, no
external CMS, no object storage.

## How it works

- **Content lives in this repo** — `content/*.json` + `content/projects/*.json`
  for text/structure, `public/media/` for images and audio.
- **Editing:** sign in at `/admin`, change anything (site settings, hero,
  about, contact, sections, focus tabs, sketch tracks, projects with
  galleries/sections/links, media uploads), hit **Save & publish**. A live
  preview updates as you type; click a section in the preview to jump to its
  editor.
- **Publish:** each save re-renders the affected pages in place (live in
  ~1s) and commits `content/` + `public/media/` to GitHub through the Git
  Data API, using a token in the server env. The repo is the durable store.
- **Restart safety:** on boot the server pulls the latest content back from
  the repo, so a container restart never loses published edits.
- **Failover:** a GitHub Action rebuilds the static site on every push to the
  content branch and deploys it to Cloudflare Pages as an always-on mirror.

Full setup walkthrough (Coolify, Cloudflare tunnel, tokens, mirror, FAQ):
[`docs/setup-guide.md`](docs/setup-guide.md).

Reusing this repo as a client-site skeleton (content model, admin, clone
checklist): [`docs/portal-foundation.md`](docs/portal-foundation.md).

## Develop

```bash
npm install
npm run dev          # vite dev server (site only)
npm run dev:server   # the real server with /admin (needs ADMIN_PASSWORD)
```

Useful env for the dev server: `ADMIN_PASSWORD`, `GITHUB_TOKEN`,
`GITHUB_REPO`, `CONTENT_BRANCH`, `PORT` (default 3000). Without
`GITHUB_TOKEN`/`GITHUB_REPO` everything works locally; publishing is skipped.

## Build & run (production)

```bash
npm run build        # vite build + SSR bundle + prerender every page
npm start            # node server/index.mjs on :3000
```

Checks:

```bash
npm run lint
npm run typecheck
npm test
```

## Stack

Vite, React, TypeScript, Framer Motion, React Router, Express, sharp.
Vitest for tests, oxlint for linting.
