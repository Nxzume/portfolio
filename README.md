# Alexandre Guichet — Portfolio

Interactive portfolio for **Alexandre Guichet**: game composition, level design, and Azure DevOps.

**Live:** [portfolio-five-steel-37.vercel.app](https://portfolio-five-steel-37.vercel.app/)

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

Checks (the same ones CI runs on every pull request):

```bash
npm run lint
npm run typecheck
npm test
```

## Edit content

Open **`/admin/`** on the live site, sign in with GitHub, edit, then **Publish**.

Edit **Your name, email & links** once for your name, tagline, email, website address, and social URLs — they update the nav, hero, footer, contact buttons, and the preview card people see when they share a link.

Photos and music: use the **Upload** button on image/file fields in `/admin/` (saved into `public/images` or `public/audio` on Publish).

Upload size limit (all fields): edit `public/admin/upload-limit.json` → `maxFileSizeBytes` (bytes), then redeploy.

Locally (no OAuth):

```bash
npm run dev
npm run cms   # second terminal
```

Then open http://localhost:5173/admin/

Content lives in `content/`. Images in `public/images/`. Audio in `public/audio/`.

Invite editors as GitHub collaborators with **write** access on this repo.

## Online admin login (owner, one-time)

1. Create a GitHub **OAuth App** with callback `https://YOUR-DOMAIN/api/callback`.
2. Set `githubClientId` in `public/admin/oauth-public.json` (public) **or** `GITHUB_CLIENT_ID` in the host env.
3. Set `GITHUB_CLIENT_SECRET` in the host env only.
4. Redeploy after changing env vars.

The login asks GitHub for the `public_repo` scope, which is enough while this repo is public. If it ever becomes private, set `GITHUB_OAUTH_SCOPE=repo` in the host env — note that `repo` grants access to every private repository the editor can see.

Check the wiring at `/api/oauth-status` (no secrets in the response).

## How pages are built

`npm run build` does three things:

1. `vite build` — the usual client bundle.
2. `vite build --ssr` — a server bundle from `src/entry-server.tsx`.
3. `scripts/prerender.mjs` — renders the homepage, every project page, and the 404 to static HTML, then writes `sitemap.xml` and `robots.txt`.

Each page ships with its own `<title>`, description, canonical URL, and Open Graph tags, so search engines and link previews see real content instead of an empty app shell. The browser hydrates that markup, so navigation stays instant.

Adding a project in the CMS adds a prerendered page automatically — no build config to touch.

## Stack

Vite, React, TypeScript, Framer Motion, React Router, Decap CMS. Vitest for tests, oxlint for linting.
