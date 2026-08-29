# Vancouverly CMS

This site is a **client website** in the Vancouverly stack. Content lives in the per-client CMS (Postgres), not in `content/*.json` at build time.

| Deploy | Repo | Coolify resource |
|--------|------|------------------|
| **Website (this repo)** | `Nxzume/portfolio` | `portfolio-web` |
| **CMS + admin** | `Nxzume/client-site-cms` | `portfolio-cms` |
| **Database** | — | `portfolio-db` |

See **`docs/DEPLOY-PORTFOLIO.md`** in the CMS monorepo for the full Coolify walkthrough.

## Local dev

1. Start the portfolio CMS profile from [client-site-cms](https://github.com/Nxzume/client-site-cms):

```bash
# in client-site-cms monorepo
docker compose up -d
CONTENT_PROFILE=portfolio npm run dev:api
```

2. In this repo:

```bash
cp .env.example .env
npm install   # runs prepare:cms-sdk — clones SDK from client-site-cms
npm run dev
```

Open `http://localhost:5175`. Content is fetched from `http://localhost:8787`.

## Production (Coolify)

Deploy **`portfolio-web`** from **this repository** (root `Dockerfile`).

Build-time args:

| Variable | Example |
|----------|---------|
| `VITE_CMS_API_URL` | `https://portfolio.vancouverly.ca` |
| `VITE_CMS_PUBLIC_KEY` | from accounts deploy panel |
| `VITE_ADMIN_URL` | `https://portfolio.vancouverly.ca/admin` |

Optional: `CMS_GIT_REF` to pin which CMS monorepo tag builds `@cms/sdk` inside the Docker image.

Editors sign in at **`https://accounts.vancouverly.ca`**. Admin UI: **`https://portfolio.vancouverly.ca/admin`**.

## Content migration

Initial content is seeded into the CMS from `clients/portfolio/content/` in the CMS monorepo when `CONTENT_PROFILE=portfolio`. The JSON files in this repo’s `content/` folder are kept as reference only — the live site reads published CMS data.
