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

## Edit content

Open **`/admin/`** on the live site, sign in with GitHub, edit, then **Publish**.

Edit **Name and links (sitewide)** once for your name, tagline, email, and social URLs — they update the nav, hero, footer, and contact buttons together.

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

## Stack

Vite, React, TypeScript, Framer Motion, React Router, Decap CMS.
