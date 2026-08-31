# Deploying to Coolify

Four resources: Postgres, Directus, a migrate app, and this site.

## 1. Directus + its database

Coolify's one-click Directus template (Postgres included), or set the two
up separately. Domain: `portfolio-cms.vancouverly.ca` (covered by the
`*.vancouverly.ca` wildcard tunnel route — no DNS work needed).

If Coolify asks for a port on the domain, use `https://portfolio-cms.vancouverly.ca:8055`
and also set `PUBLIC_URL=https://portfolio-cms.vancouverly.ca` (no port) as
an env var on the service.

## 2. Migrate app (schema automation — do this before deploying the site)

A small, **non-public** Coolify app that runs `cms/migrate.mjs` on your
server. It creates/updates the schema, migrates `content/*.json` into
Directus if empty, and grants public read — idempotent, safe to re-run.

Why not just run the script from your laptop: Cloudflare (or whatever's in
front of Directus) often blocks GitHub Actions' IPs with a 403, but your
Coolify server talking to its own Directus never leaves your
infrastructure, so it isn't blocked.

1. Coolify → **+ New** → **Application** → this repo, branch `master`
2. **General** tab: Build Pack `Dockerfile`, **Base Directory** `/cms`,
   **Dockerfile Location** `/Dockerfile`, leave **Ports Exposes** empty
3. **No domain**
4. Env vars (runtime): `DIRECTUS_URL=https://portfolio-cms.vancouverly.ca`,
   `DIRECTUS_TOKEN=<admin static token>` (Directus → User Directory → your
   admin user → Token → Generate Token)
5. **Deploy**, check **Logs** (left sidebar, not the deploy build log) for
   `CMS migrate done.`

### Automate it on push (optional)

Copy this app's **Deploy Webhook** URL, add it as a GitHub repository
secret named `COOLIFY_MIGRATE_WEBHOOK`.
`.github/workflows/coolify-migrate-deploy.yml` then redeploys this app
whenever `cms/` changes on `master` — GitHub only pings Coolify, never
calls Directus directly, so Cloudflare blocking doesn't apply to this path.

`.github/workflows/cms-migrate.yml` runs migrate directly from a
GitHub-hosted runner (manual trigger) — try this first; if it 403s, use the
migrate-app + webhook path instead.

## 3. The site

Coolify → **+ New** → **Application** → this repo → **Dockerfile** build
pack (root `Dockerfile`, not `/cms`). Domain: this site's real domain.

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
   (or however many projects exist by then)
3. Visit the deployed site, confirm content matches Directus, click into a
   project page
4. Edit something in Directus, save, redeploy the site in Coolify, confirm
   the change shows up
5. Edit `cms/migrate.mjs` (add a field), push to `master`, confirm the
   migrate app redeploys automatically (if the webhook is set up)
