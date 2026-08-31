# Portfolio site — setup & automation guide

Complete instructions for deploying on Coolify with Directus, automating CMS
migrations, and editing content day-to-day.

**Domains used in examples:**

| Resource | URL |
|----------|-----|
| Site | `https://alexandreguichet.vancouverly.ca` |
| CMS | `https://alexandreguichet-cms.vancouverly.ca` |

Adjust to your actual domain. The `*.vancouverly.ca` wildcard tunnel route
covers subdomains without extra DNS work.

---

## Architecture

Four Coolify resources in one project:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Site app       │────▶│  Directus (CMS)  │◀────│  Migrate app    │
│  (this repo)    │     │  + Postgres      │     │  (cms/ folder)  │
│  Dockerfile     │     │  one-click svc   │     │  runs on deploy │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        ▲
        │  build fetches         │  you edit content here
        │  content at build      │
        └────────────────────────┘
```

- **Site** — static React app with prerendered HTML, nginx. Content is pulled
  from Directus **during the Docker build**, then baked into static files.
- **Directus** — headless CMS. Edit copy in normal form fields (not raw JSON).
- **Migrate app** — runs `cms/migrate.mjs` on your server when deployed.
  Creates schema, seeds initial content, fixes permissions. Not a public site.

**Important:** Unlike Vancouverly, content changes require a **site redeploy**
(build-time fetch). Editing Directus alone does not update the live site until
you rebuild.

---

## Before you start

### GitHub repo

`https://github.com/Nxzume/portfolio` — branch **`master`**.

---

## Part 1 — Deploy Directus

1. Coolify → your project → **+ Add** → **Service**
2. Pick **Directus** (with **PostgreSQL**)
3. Name it something like `portfolio-directus` (separate from Vancouverly’s CMS)

### Environment variables

Left sidebar → **Environment Variables** → **+ Add** for each:

| Key | Value |
|-----|-------|
| `ADMIN_EMAIL` | your email |
| `CORS_ORIGIN` | `https://alexandreguichet.vancouverly.ca` |

Your admin password is auto-generated — find it as **`SERVICE_PASSWORD_ADMIN`**
on the same page. Copy and save it.

### Domain

1. **Configuration** → **Services** → **`directus`** tab → **Settings**
2. **Domains** field:

   ```
   https://alexandreguichet-cms.vancouverly.ca:8055
   ```

   The `:8055` is required — it tells Coolify which container port to proxy to.
   Visitors still use `https://alexandreguichet-cms.vancouverly.ca` (no port in the browser).

3. **Save**

### One more env var

**Environment Variables** → **+ Add**:

| Key | Value |
|-----|-------|
| `PUBLIC_URL` | `https://alexandreguichet-cms.vancouverly.ca` |

No `:8055` here.

### Deploy and log in

1. Top right → **Deploy**
2. Open `https://alexandreguichet-cms.vancouverly.ca`
3. Log in with `ADMIN_EMAIL` + `SERVICE_PASSWORD_ADMIN`

---

## Part 2 — Bootstrap the CMS (first time only)

Pick **one** method.

### Option A — Coolify migrate app (recommended)

Set up Part 4 below first, then **Deploy** the migrate app. Check **Logs**
(left sidebar, not deployment log) for `CMS migrate done.`

### Option B — Your laptop (PowerShell)

```powershell
git clone https://github.com/Nxzume/portfolio.git
cd portfolio

$env:DIRECTUS_URL = "https://alexandreguichet-cms.vancouverly.ca"
$env:DIRECTUS_TOKEN = "your_admin_token"
npm run cms:migrate
```

**Get a token:** Directus → **User Directory** → your admin user → **Token** →
**Generate Token**.

### Verify

Open in a private/incognito window:

```
https://alexandreguichet-cms.vancouverly.ca/items/site_settings
```

You should see JSON. If 403, re-run migrate.

---

## Part 3 — Deploy the site

1. Coolify → **+ Add** → **Application**
2. Connect GitHub repo `Nxzume/portfolio`, branch **`master`**
3. **General** tab:

   | Setting | Value |
   |---------|-------|
   | Build Pack | `Dockerfile` (not Nixpacks) |
   | Ports Exposes | `80` |

4. **Domains:**

   ```
   https://alexandreguichet.vancouverly.ca
   ```

   If Coolify requires a port: `https://alexandreguichet.vancouverly.ca:80`

5. **Environment Variables** → **+ Add**:

   | Key | Value | Build-time? |
   |-----|-------|-------------|
   | `DIRECTUS_URL` | `https://alexandreguichet-cms.vancouverly.ca` | **Yes** — check "Available at Buildtime" |

6. **Deploy**

### Verify the build pulled CMS content

In the site app’s **deployment build log**, look for:

```
Wrote 8 global file(s) and 2 project(s).
```

If you see `DIRECTUS_URL not set — skipping CMS fetch`, the build-time env var
is missing — add it and redeploy.

Site is live at `https://alexandreguichet.vancouverly.ca`.

---

## Part 4 — Migrate app (automation)

Runs CMS schema updates on **your server** — avoids Cloudflare blocking GitHub’s IPs.

### Create the app

1. Coolify → **+ Add** → **Application**
2. Same repo, branch **`master`**
3. **General** tab:

   | Setting | Value |
   |---------|-------|
   | Build Pack | `Dockerfile` |
   | Base Directory | `/` (repo root — **not** `/cms`) |
   | Dockerfile Location | `/cms/Dockerfile` |
   | Ports Exposes | leave empty |

4. **No domain** — this app is not public
5. **Save**

### Environment variables (migrate app only)

| Key | Value | Build-time? |
|-----|-------|-------------|
| `DIRECTUS_URL` | `https://alexandreguichet-cms.vancouverly.ca` | No (runtime only) |
| `DIRECTUS_TOKEN` | admin static token | No |

### Deploy and read logs

1. **Deploy**
2. Wait until status is **Running**
3. Left sidebar → **Logs** (not the deployment build log)

Success looks like:

```
=== CMS migrate starting ===
Directus reachable (public API)
Admin token verified
CMS migrate done.
=== Migrate succeeded — container staying alive for logs ===
```

### Manual re-run anytime

Coolify → migrate app → **Deploy**. Safe to run repeatedly — migrate is idempotent.

---

## Part 5 — Auto-run migrate on push (optional)

GitHub does **not** call Directus directly. It only pings Coolify to redeploy the migrate app.

### Step 1 — Copy webhook from Coolify

1. Open the **migrate application** (not the site app)
2. **Configuration** → **Webhooks**
3. Copy the **Deploy Webhook** URL

### Step 2 — Add GitHub secret

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Use **Repository secrets** (not Environment secrets)
3. **New repository secret**:

   | Name | Value |
   |------|-------|
   | `COOLIFY_MIGRATE_WEBHOOK` | paste webhook URL from Coolify |

You do **not** need `DIRECTUS_URL` or `DIRECTUS_TOKEN` in GitHub — those live on the migrate app in Coolify.

### What triggers it

Pushing changes under `cms/` to `master` runs the **Trigger Coolify CMS migrate**
workflow, which hits the webhook → Coolify redeploys migrate → migrate runs on your server.

Manual trigger: GitHub → **Actions** → **Trigger Coolify CMS migrate** → **Run workflow**.

---

## Part 6 — Auto-deploy the site on push (optional)

In Coolify on the **site application**:

1. **Configuration** → enable **Auto Deploy** / connect GitHub webhook
2. Every push to `master` rebuilds and redeploys the site

Or deploy manually: **Deploy** button after each push.

**Content edits:** After saving in Directus, click **Deploy** on the **site app**
(or wait for auto-deploy if you wired a webhook). The migrate app does **not**
rebuild the site — only the site app does.

---

## Editing content in Directus

Log in at `https://alexandreguichet-cms.vancouverly.ca`.

### portfolio_globals (singleton)

One JSON field per section. Each field matches a file under `content/`:

| Field | Section |
|-------|---------|
| `site` | Site title, meta, nav |
| `hero` | Hero headline and intro |
| `about` | About section |
| `contact` | Contact info |
| `focuses` | Focus areas |
| `sketches` | Audio sketches |
| `score` | Score desk |
| `projects_section` | Projects section header |

Edit the JSON in Directus’s code editor. Shape is validated by
`src/content/normalize.ts` on the site side.

### projects (collection)

One row per project:

| Field | Purpose |
|-------|---------|
| `slug` | URL path, e.g. `arena` → `/projects/arena` |
| `sort` | Display order |
| `payload` | Full project JSON (title, summary, body, images, etc.) |

Adding a project in Directus creates a new prerendered page on the **next site build**.

### Media (images & audio)

Files live in `public/images/` and `public/audio/` in the repo. Directus stores
image paths as strings pointing at those files. To add new media:

1. Add the file to `public/` (commit + push, or upload via your workflow)
2. Reference the path in the Directus JSON

---

## Day-to-day workflows

| Task | How |
|------|-----|
| Edit copy or projects | Directus → save → **Deploy site app** in Coolify |
| Change code or design | Push to `master` → Coolify redeploy **site app** |
| Add CMS fields / schema | Push `cms/` changes → migrate auto-runs (if webhook set) or **Deploy migrate app** |
| New portfolio instance | New Directus + new site app + new migrate app |

---

## Local development

```bash
npm install
npm run dev
```

Build with live CMS content:

```powershell
# PowerShell
$env:DIRECTUS_URL = "https://alexandreguichet-cms.vancouverly.ca"
npm run build
```

Without `DIRECTUS_URL`, build uses whatever is already in `content/`.

Run migrate against your CMS:

```powershell
$env:DIRECTUS_URL = "https://alexandreguichet-cms.vancouverly.ca"
$env:DIRECTUS_TOKEN = "your_token"
npm run cms:migrate
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build skips CMS fetch | `DIRECTUS_URL` must be **build-time** on site app — redeploy |
| Build log shows 403 on fetch | Re-deploy migrate app (grants public read) |
| Site shows old content after Directus edit | Redeploy **site app** — content is build-time, not runtime |
| 403 on `/items/...` in browser | Re-deploy migrate app |
| Migrate logs empty | Open **Logs** sidebar after app shows **Running**, not deployment log |
| Migrate 403 on token | Regenerate admin token, update `DIRECTUS_TOKEN` on **migrate app** |
| GitHub webhook does nothing | Check `COOLIFY_MIGRATE_WEBHOOK` is a **repository** secret |
| Directus domain won't save | Include port: `https://alexandreguichet-cms.vancouverly.ca:8055` |
| Migrate can't find content | Migrate app Base Directory must be `/` (repo root), not `/cms` |

---

## File reference

| Path | Purpose |
|------|---------|
| `cms/migrate.mjs` | Idempotent CMS migration (schema, seed, permissions) |
| `cms/Dockerfile` | Migrate app container |
| `Dockerfile` | Site app (Vite build → nginx) |
| `scripts/fetch-cms-content.mjs` | Pulls content from Directus at build time |
| `.github/workflows/coolify-migrate-deploy.yml` | Triggers Coolify migrate via webhook |

---

## Quick command reference

```powershell
# Migrate from laptop (PowerShell)
$env:DIRECTUS_URL = "https://alexandreguichet-cms.vancouverly.ca"
$env:DIRECTUS_TOKEN = "your_token"
npm run cms:migrate

# Test public API (should return JSON)
curl https://alexandreguichet-cms.vancouverly.ca/items/site_settings
```
