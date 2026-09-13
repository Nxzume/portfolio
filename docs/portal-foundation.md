# Portal foundation — how this site works

A reusable skeleton for client sites: **JSON content in the repo**, a **Vite/React** public site, a built-in **`/admin` portal**, and **one Docker container** that serves everything. No database, no external CMS, no object storage.

Use this when you clone the repo for a new client. Coolify / Cloudflare / token steps live in [`setup-guide.md`](./setup-guide.md).

---

## Mental model

```
content/*.json  +  public/{media,images,audio}/
        │
        ▼
  normalize → Content
        │
   ┌────┴────┐
   ▼         ▼
Public     /admin
(prerendered  (edit → re-prerender
 HTML + SPA)   → git commit)
        │
        ▼
  Express on :3000
  (Coolify) + optional
  Cloudflare Pages mirror
```

**The repo is the CMS.** Saving in `/admin` rewrites HTML on disk (about a second) and commits `content/` + media to GitHub. On boot the container pulls that content again, so restarts do not lose edits.

---

## Stack (keep these)

| Piece | Role |
|---|---|
| Vite + React 19 + TypeScript | Public UI + admin UI |
| React Router | `/`, `/projects/:slug`, 404 |
| Framer Motion | Motion (respects reduced motion) |
| Express (`server/index.mjs`) | Static site, media, `/admin`, `/api/admin/*`, `/healthz` |
| `sharp` | Image uploads → WebP |
| GitHub Git Data API | Publish + boot sync |
| Docker + Coolify | Single service on port **3000** |
| Cloudflare Pages (optional) | Static mirror via `.github/workflows/mirror.yml` |

---

## Directory map

| Path | Purpose |
|---|---|
| `content/*.json` | Global site copy |
| `content/projects/*.json` | One file per project page |
| `content/_templates/project.json` | Starter shape for “new project” in admin |
| `content/_history/` | Changelog (runtime; do not hand-edit) |
| `public/images/`, `public/audio/` | Hand-placed / legacy assets |
| `public/media/` | Admin uploads (prefer this for new media) |
| `src/pages/` | `HomePage`, `ProjectPage`, `NotFound` |
| `src/components/` | Hero, Projects, ScoreDesk, About, Contact, Nav, FocusSwitcher, … |
| `src/content/` | Types, normalize, load, React context (`index.ts` = browser bake; `node.ts` = disk) |
| `src/hooks/useSketchPlayer.ts` | Audio player (blob URLs so seek works behind CDNs) |
| `src/admin/` | Portal UI, editors, live preview, media library, changelog |
| `src/styles/` + `src/index.css` | Public theme (CSS variables + section sheets) |
| `src/entry-server.tsx` | SSR render used by prerender |
| `scripts/prerender.mjs` | Writes HTML into `dist/` |
| `server/` | Express app, auth, content store, GitHub publish, pipeline |
| `docs/setup-guide.md` | Coolify / Cloudflare / tokens |
| `Dockerfile` | Production image |

---

## Content model

Each top-level JSON file maps to an admin editor and (usually) a homepage section.

| File | Controls |
|---|---|
| `content/site.json` | Name, tagline, email, canonical `url`, social `links` |
| `content/hero.json` | Hero headline, image, primary/secondary CTAs |
| `content/projects-section.json` | Projects block eyebrow / title / lede |
| `content/score.json` | Music section copy (`#compose`) |
| `content/sketches.json` | Track list for the player (`tracks[]` or a bare array) |
| `content/about.json` | Portrait, lead, body, optional note + timeline |
| `content/contact.json` | Contact section copy + optional email button label |
| `content/focuses.json` | Focus tabs (admin + `FocusSwitcher` exist; **not mounted on the homepage by default**) |
| `content/projects/<slug>.json` | Full project page |

**Loaders**

- Browser bundle: `src/content/index.ts` (JSON imported at build time).
- Server / prerender / admin preview: disk via `src/content/node.ts` + `normalize.ts`.
- Project paths containing `/_` are skipped (templates live under `_templates`).

**Media paths in JSON** are public URLs, e.g. `/media/cover.webp`, `/images/hero.jpg`, `/audio/track.mp3`.

---

## Public site shape

**Routes** (`src/App.tsx`)

- `/` → home
- `/projects/:slug` → project detail
- `*` → 404
- `/admin` → admin SPA (bootstrapped separately in `src/main.tsx`)

**Home section order** (`src/pages/HomePage.tsx`)

1. Nav (anchors: Projects, Music, About, Contact)
2. Hero
3. Projects
4. ScoreDesk (music player)
5. About
6. Contact + Footer

**Music player** — `useSketchPlayer` fetches audio into a **blob URL** before play so scrubbing works even when a CDN mishandles Range requests. Prefer real files on each sketch; empty audio falls back to a generative placeholder (skip that for client demos).

---

## Admin portal (`/admin`)

1. Set `ADMIN_PASSWORD` or the admin API stays disabled.
2. Sign in → session cookie `ag_session` (HttpOnly).
3. Edit site / sections / projects / media.
4. Live preview renders the real page components; click a section to jump to its editor.
5. **Save & publish** → rewrite prerendered HTML on disk, then commit to GitHub when publish env is set.
6. Changelog / revert is available in the admin UI (history under `content/_history/`).

**Local admin**

```bash
npm install
ADMIN_PASSWORD=dev npm run dev:server
# open http://localhost:3000/admin
```

`npm run dev` is Vite only (no admin API). Use `dev:server` when you need to save content.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (frontend only) |
| `npm run dev:server` | Full Express app with `/admin` |
| `npm run build` | `tsc` + Vite client build + SSR build + prerender |
| `npm run build:deploy` | Same without `tsc` (image/CI already typechecks) |
| `npm start` | `node server/index.mjs` |
| `npm run lint` / `typecheck` / `test` | oxlint, `tsc`, vitest |

Health check: **`GET /healthz`** → `{ ok: true }`.

---

## Theme / branding

Public look is driven by CSS variables in `src/index.css` (`:root`):

- Colors: ink / paper / signal (accent) / line tokens
- Fonts: display / body / mono (linked from `index.html`)
- Motion easing token

Section styles live in `src/styles/*.css`. Admin uses `src/admin/admin.css` and does not share the public accent system.

For a new client: change tokens + fonts first; touch section CSS only if the layout must diverge.

---

## Clone checklist (new client)

### 1. Repo & deploy target

- [ ] Private GitHub repo (content + media will be committed here)
- [ ] Coolify app from Dockerfile, port **3000**, health **`/healthz`**
- [ ] **Turn off** Coolify auto-deploy on the content branch (admin saves already go live; auto-deploy would rebuild on every save)
- [ ] Env:

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | yes | Enables `/admin` |
| `GITHUB_TOKEN` | yes (to publish) | Fine-grained: Contents read/write on this repo |
| `GITHUB_REPO` | yes | `owner/name` |
| `CONTENT_BRANCH` | yes | Usually `master` |
| `ADMIN_SECRET` | optional | Cookie signing; defaults to password |
| `SESSION_TTL_HOURS` | optional | Default `12` |
| `SYNC_ON_BOOT` | optional | Default `true` |
| `MAX_UPLOAD_MB` | optional | Default `20` |
| `MEDIA_MAX_DIMENSION` | optional | Default `1920` |
| `MEDIA_QUALITY` | optional | Default `82` |

Full Coolify / tunnel / mirror walkthrough: [`setup-guide.md`](./setup-guide.md).

### 2. Replace client content

- [ ] `content/site.json` — name, tagline, email, url, links
- [ ] `content/hero.json`, `about.json`, `contact.json`, and other section JSON
- [ ] Replace `content/projects/*` (start from `content/_templates/project.json`)
- [ ] Replace or empty `content/sketches.json` if there is no music section
- [ ] Swap `public/images`, `public/audio`, `public/media`, `public/favicon.svg`

### 3. Skin

- [ ] Tokens in `src/index.css`
- [ ] Fonts in `index.html`
- [ ] Any hard-coded default title/description in the Vite HTML head plugin / meta helpers

### 4. Optional product cuts

- [ ] Remove ScoreDesk + sketches if the client has no audio
- [ ] Mount `FocusSwitcher` on the homepage only if you want focus tabs public
- [ ] Rename cookie `ag_session` in `server/lib/auth.mjs` if several portals share a parent domain

### 5. Leave alone (platform)

- `server/**` publish pipeline, boot sync, CSP, static routing
- Prerender / `entry-server` / content normalize contracts
- Admin shell + live preview architecture
- Audio blob-URL playback + CDN no-store headers on audio
- One-container Docker model

---

## Gotchas

1. **Audio seek behind Cloudflare** — full-object edge cache can break Range seeks. This skeleton plays from blob URLs and sets CDN no-store on audio; don’t strip that.
2. **Two (really three) media roots** — `/images`, `/audio`, and `/media`. Admin uploads go to `/media`. Publish sync covers all of them.
3. **CSP** — server allows self + Google Fonts (and Cloudflare insights if used). New third-party scripts/fonts need a CSP edit in `server/index.mjs`.
4. **Prerender shell** — admin and prerender expect a clean HTML shell with empty `#root`. Odd prerender failures → full `npm run build`.
5. **Vite-only `dev` does not save content** — disk writes and GitHub publish need `dev:server` / production.
6. **Private repo** — published content and media live in git.
7. **Image uploads** — re-encoded to WebP and resized; originals are not kept.
8. **Focus tabs** — editing `focuses.json` does nothing on the public site until `FocusSwitcher` is mounted on the homepage.

---

## Suggested workflow per client

1. Clone this repo into a new **private** GitHub repo.
2. Strip personal content; drop in client JSON + media.
3. Adjust theme tokens / fonts.
4. Deploy Coolify with env vars; point domain / tunnel.
5. Hand the client `/admin` (optionally put Cloudflare Access in front of it).
6. You ship code upgrades; they keep content in git via the portal.

When you improve the skeleton (player, admin UX, deploy), merge or cherry-pick into client repos the same way you would a shared design system — their `content/` and `public/media/` stay theirs.

---

## Related docs

- [`setup-guide.md`](./setup-guide.md) — Coolify, Cloudflare tunnel, GitHub token, Pages mirror
- Root [`README.md`](../README.md) — short overview and scripts
