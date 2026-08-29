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

## Content

Content lives in `content/*.json` and `content/projects/*.json` — but these
files are **generated at build time**, not hand-edited or committed here.
`npm run build` runs `scripts/fetch-cms-content.mjs` first, which pulls the
current published content from this site's client-site-cms instance and
writes it into those files, exactly as before.

**To edit content:** log into the CMS admin (`<this-site>-admin.vancouverly.ca`),
edit, and hit Publish. Then trigger a rebuild of this app in Coolify (or wire
a deploy webhook to Publish) — the next build pulls the new content.

Required env for the build (set as build-time vars in Coolify):

```env
CMS_API_URL=https://<slug>-admin.vancouverly.ca
CMS_PUBLIC_KEY=<same value as PUBLIC_API_KEY on that CMS instance>
```

If unset, the fetch step is skipped and the build uses whatever is already in
`content/` — useful for local development without a CMS running.

Images and audio still live in `public/images/` and `public/audio/` — the CMS
stores image fields as plain URL strings pointing at files already in those
folders, so uploading new media is a separate step (add the file to
`public/`, then reference its path from the CMS admin's JSON editor for that
field).

## How pages are built

`npm run build` does three things:

1. `vite build` — the usual client bundle.
2. `vite build --ssr` — a server bundle from `src/entry-server.tsx`.
3. `scripts/prerender.mjs` — renders the homepage, every project page, and the 404 to static HTML, then writes `sitemap.xml` and `robots.txt`.

Each page ships with its own `<title>`, description, canonical URL, and Open Graph tags, so search engines and link previews see real content instead of an empty app shell. The browser hydrates that markup, so navigation stays instant.

Adding a project in the CMS adds a prerendered page automatically — no build config to touch.

## Stack

Vite, React, TypeScript, Framer Motion, React Router. Vitest for tests, oxlint for linting.
