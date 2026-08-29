# Vancouverly CMS

This site is a **client website** in the Vancouverly stack. Content lives in the per-client CMS (Postgres), not in `content/*.json` at build time.

| Deploy | Repo | Coolify resource |
|--------|------|------------------|
| **Website (this repo)** | `Nxzume/portfolio` | `portfolio-web` |
| **CMS + admin** | `Nxzume/client-site-cms` | `portfolio-cms` |
| **Database** | — | `portfolio-db` |

## Local dev

1. Start the portfolio CMS profile from [client-site-cms](https://github.com/Nxzume/client-site-cms):

```bash
# in client-site-cms monorepo
docker compose up -d
CONTENT_PROFILE=portfolio npm run dev:api
```

2. Seed content from this repo (once per fresh DB):

```bash
# Sign in via CMS dev login or accounts, then:
CMS_ADMIN_TOKEN=<jwt> npm run seed:cms
```

3. In this repo:

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
| `CMS_GIT_REF` | `master` (pins SDK clone in Docker build) |

**`portfolio-cms`** deploys from `Nxzume/client-site-cms` with `CONTENT_PROFILE=portfolio`.

Editors sign in at **`https://accounts.vancouverly.ca`**. Admin UI: **`https://portfolio.vancouverly.ca/admin`**.

## Content migration

The `content/` folder in this repo is the source of truth for **initial** CMS data. After deploy, run:

```bash
CMS_URL=https://portfolio.vancouverly.ca CMS_ADMIN_TOKEN=<jwt> npm run seed:cms
```

The live site reads **published** data from the CMS API at runtime.
