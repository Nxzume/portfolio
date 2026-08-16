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
npm run test:security
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

## Online admin login (owner setup)

The admin uses a GitHub App user token restricted to this repository. Classic
OAuth credentials are ignored because `public_repo` and `repo` scopes grant
access to repositories beyond this portfolio.

1. Choose the deployed HTTPS origin, for example `https://portfolio-five-steel-37.vercel.app`. Use that same origin for the GitHub App, host environment, and callback.
2. Under the `Nxzume` account, create a GitHub App with:
	- Homepage URL: the deployed origin.
	- Callback URL: `DEPLOYED_ORIGIN/api/callback`.
	- Expiring user authorization tokens enabled.
	- Webhooks disabled.
	- Repository permissions: **Contents — Read and write**, **Pull requests — Read and write**, and **Commit statuses — Read-only**.
	- No account or organization permissions.
	- Installation limited to the app owner's account.
3. Install the app and select only `Nxzume/portfolio`.
4. Set `SITE_URL=DEPLOYED_ORIGIN`, `GITHUB_APP_CLIENT_ID`, and `GITHUB_APP_CLIENT_SECRET` in the host environment. `SITE_URL` must be a bare HTTPS origin and is never inferred from request headers. Keep the client secret in the host environment only.
5. Redeploy and confirm `/api/oauth-status` reports `authType: github-app`, `hasSiteUrl: true`, and `configurationReady: true`.

The login uses PKCE and binds the GitHub token exchange to immutable repository
ID `1334579175`. Before returning an issued `ghu_` token to Decap, the callback
enumerates the token's GitHub App installations and repositories. Login succeeds
only when the complete accessible set is one selected installation owned by
`Nxzume`, with exactly the documented app permissions, and one repository:
`Nxzume/portfolio`. The repository identity is compiled into the authentication
handler and cannot be overridden by deployment configuration. Expiring tokens
require an editor to sign in again after expiration.

Decap preview rendering remains disabled because Decap CMS 3.8.3 is affected by
CVE-2025-57520. Editing and publishing continue through the form.

## How pages are built

`npm run build` does three things:

1. `vite build` — the usual client bundle.
2. `vite build --ssr` — a server bundle from `src/entry-server.tsx`.
3. `scripts/prerender.mjs` — renders the homepage, every project page, and the 404 to static HTML, then writes `sitemap.xml` and `robots.txt`.

Each page ships with its own `<title>`, description, canonical URL, and Open Graph tags, so search engines and link previews see real content instead of an empty app shell. The browser hydrates that markup, so navigation stays instant.

Adding a project in the CMS adds a prerendered page automatically — no build config to touch.

## Stack

Vite, React, TypeScript, Framer Motion, React Router, Decap CMS. Vitest for tests, oxlint for linting.
