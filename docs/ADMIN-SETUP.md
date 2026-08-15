# One-time admin setup (site owner)

Live site: **https://portfolio-five-steel-37.vercel.app/**

The visual editor works on this domain, other hosts, or fully offline on a laptop. Content saves to GitHub.

## 1. Invite your friend on GitHub

1. Open https://github.com/Nxzume/portfolio  
2. **Settings → Collaborators → Add people**  
3. Invite Alexandre (write access) and have them accept  

## 2. Local editing (no OAuth needed)

```bash
npm install
npm run dev
# other terminal:
npm run cms
```

Open http://localhost:5173/admin/

## 3. Online editing on the live site

### A. GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**  
2. Use **this** site (must match exactly):
   - **Homepage URL:** `https://portfolio-five-steel-37.vercel.app`  
   - **Authorization callback URL:** `https://portfolio-five-steel-37.vercel.app/api/callback`  
3. Create → copy **Client ID** → generate **Client Secret**

If the OAuth App still points at an old `*.vercel.app` URL, edit it to the URLs above.

### B. Vercel env vars (same project as this site)

In Vercel → project for **portfolio-five-steel-37** → **Settings → Environment Variables**:

| Key | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret |

- Turn **Sensitive** on for the secret  
- Environments: **Production** and **Preview**  
- Click **Save**

### C. Redeploy (required)

Env vars do **not** apply until a new deployment:

Vercel → Deployments → … on latest → **Redeploy**

### D. Verify

1. Open https://portfolio-five-steel-37.vercel.app/api/oauth-status  
   You want `"hasClientId": true` and `"hasClientSecret": true`  
2. Open https://portfolio-five-steel-37.vercel.app/admin/  
3. **Login with GitHub** → edit → Publish  

## Notes

- `/admin` picks up the current domain automatically (`base_url` is set in the browser).  
- Wrong Vercel project / skipped Redeploy is the usual reason for `Missing GITHUB_CLIENT_ID`.
