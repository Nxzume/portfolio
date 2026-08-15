# One-time admin setup (site owner)

Live site: **https://portfolio-five-steel-37.vercel.app/**

## Why you still see `Missing GITHUB_CLIENT_ID`

Almost always one of these:

1. Env vars were saved but you **did not Redeploy** afterward  
2. Vars were added on a **different** Vercel project (must be the one for `portfolio-five-steel-37`)  
3. GitHub OAuth callback still points at an **old** `*.vercel.app` URL  
4. Production is still serving an **old deployment**

**Saving env vars alone does nothing** until you Redeploy.

## What you must do in Vercel

Only the **Client Secret** is required in Vercel (Client ID can live in the repo).

1. Open the Vercel project that owns **portfolio-five-steel-37.vercel.app**  
2. **Settings → Environment Variables**  
3. Add:

| Key | Value | Environments |
| --- | --- | --- |
| `GITHUB_CLIENT_SECRET` | from GitHub OAuth App → Generate a new client secret | Production **and** Preview |

Optional: also set `GITHUB_CLIENT_ID` there. Not required if you fill `public/admin/oauth-public.json`.

4. Click **Save**  
5. Go to **Deployments** → open the latest production deployment → **⋯ → Redeploy** (do **not** skip build cache if unsure — Redeploy is fine)

### Also check (common blockers)

- **Deployment Protection / Vercel Authentication**: if Preview or Production requires a Vercel login, turn it off for this project (or allow public access to `/api/*`), otherwise GitHub cannot complete OAuth.  
- Confirm you edited the **same** Vercel project as the URL you open in the browser.

## Fastest full fix

### 1) GitHub OAuth App

GitHub → Settings → Developer settings → OAuth Apps → New (or edit existing):

- Homepage: `https://portfolio-five-steel-37.vercel.app`  
- Callback: `https://portfolio-five-steel-37.vercel.app/api/callback`

### 2) Put Client ID in the repo (Client ID is public)

Edit `public/admin/oauth-public.json`:

```json
{
  "githubClientId": "Ov23liXXXXXXXX"
}
```

Commit + push to `master` (or merge the PR that adds this file).

### 3) Put Client Secret only in Vercel

See table above → Save → **Redeploy**.

### 4) Verify

1. https://portfolio-five-steel-37.vercel.app/api/oauth-status  
   Expect `hasClientId: true` and `hasClientSecret: true`  
2. https://portfolio-five-steel-37.vercel.app/admin/ → Login with GitHub  

## Local editing (no Vercel env needed)

```bash
npm run dev
npm run cms
```

Open http://localhost:5173/admin/

## Invite Alexandre

GitHub repo → Settings → Collaborators → add with write access.
