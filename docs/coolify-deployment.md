# Deploying to Coolify

Three resources: Postgres, Directus, and this site.

## 1. Directus + its database

Coolify's one-click Directus template (Postgres included), or set the two
up separately. Domain: `portfolio-cms.vancouverly.ca` (covered by the
`*.vancouverly.ca` wildcard tunnel route — no DNS work needed).

Once it's running, set up this site's schema and migrate the existing
content in:

```bash
cd cms
DIRECTUS_URL=https://portfolio-cms.vancouverly.ca DIRECTUS_TOKEN=<admin token> node apply-schema.mjs
DIRECTUS_URL=https://portfolio-cms.vancouverly.ca DIRECTUS_TOKEN=<admin token> node seed-content.mjs
DIRECTUS_URL=https://portfolio-cms.vancouverly.ca DIRECTUS_TOKEN=<admin token> node grant-public-read.mjs
```

Get an admin token via `POST /auth/login`, or generate a Static Access
Token on the admin user from the Directus UI.

## 2. The site

Coolify → **+ New** → **Application** → this repo → **Dockerfile** build
pack. Domain: whatever this site's actual domain is (the current live one
is `portfolio-five-steel-37.vercel.app` — point the real domain at the
tunnel once ready to cut over).

Build-time env var (mark it **Available at Buildtime**):

```env
DIRECTUS_URL=https://portfolio-cms.vancouverly.ca
```

If unset, the build still succeeds — it skips the CMS fetch and uses
whatever's already committed in `content/`.

## Verify

1. `https://portfolio-cms.vancouverly.ca/items/portfolio_globals` returns
   real data with no auth header
2. The site's build logs show `Wrote 8 global file(s) and 2 project(s).`
   (or however many projects exist by then) — confirms it actually pulled
   from Directus, not silently falling back
3. Visit the deployed site, confirm content matches Directus, click into a
   project page
4. Edit something in Directus, save, redeploy the site in Coolify, confirm
   the change shows up — proves the full edit → publish → rebuild loop
