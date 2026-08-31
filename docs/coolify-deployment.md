# Deploying to Coolify

**Full step-by-step guide:** [setup-guide.md](./setup-guide.md)

Quick checklist:

1. **Directus** — one-click service, domain `https://portfolio-cms.vancouverly.ca:8055`,
   `PUBLIC_URL=https://portfolio-cms.vancouverly.ca`, `CORS_ORIGIN=https://portfolio.vancouverly.ca`
2. **Migrate app** — same repo, branch `master`, Base Directory `/`, Dockerfile `/cms/Dockerfile`,
   env `DIRECTUS_URL` + `DIRECTUS_TOKEN`, no public domain
3. **Site app** — Dockerfile build pack, port 80, build-time `DIRECTUS_URL=https://portfolio-cms.vancouverly.ca`

After editing content in Directus, **redeploy the site app** (content is fetched at build time).

Verify build log shows: `Wrote 8 global file(s) and N project(s).`
