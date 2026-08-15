# One-time admin setup (site owner)

The visual editor works on **any host** (Vercel, Netlify, custom domain) and also **fully offline on your laptop**. It is not locked to Vercel.

Content is saved to GitHub. Wherever the public site is hosted, it just needs to rebuild from the repo.

## 1. Invite your friend on GitHub

1. Open https://github.com/Nxzume/portfolio  
2. **Settings → Collaborators → Add people**  
3. Invite Alexandre’s GitHub username (write access)  
4. They accept the invite  

## 2. Local editing (works with no Vercel / no Netlify)

Best for day-to-day work, and requires **no OAuth app**:

```bash
npm install
npm run dev
# other terminal:
npm run cms
```

Open http://localhost:5173/admin/

Publish writes files straight into your local repo (via `decap-server`). Commit/push when ready, or let your host auto-deploy from GitHub.

## 3. Online editing from the live site (any host)

### Create a GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**  
2. Fill in using **whatever domain serves the site**:
   - **Homepage URL:** `https://YOUR-DOMAIN`  
   - **Authorization callback URL:** `https://YOUR-DOMAIN/api/callback`  
3. Copy **Client ID** and generate **Client Secret**

Examples:
- Vercel: `https://your-app.vercel.app/api/callback`
- Netlify: `https://your-app.netlify.app/api/callback`
- Custom domain: `https://alexandre.example.com/api/callback`

If you change domains later, update the OAuth App callback to match.

### Add env vars on your host

| Name | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | from the OAuth App |
| `GITHUB_CLIENT_SECRET` | from the OAuth App |

Supported out of the box:
- **Vercel** — uses `/api/auth` + `/api/callback`
- **Netlify** — same `/api/*` paths (proxied in `netlify.toml`)

Redeploy after saving env vars.

### Smoke test

1. Visit `https://YOUR-DOMAIN/admin/`  
2. Login with GitHub  
3. Edit **About me** → Publish  
4. Confirm a commit on `master` and a host rebuild  

## Notes

- The editor sets `base_url` from the current browser origin, so the same `/admin` works on every domain.
- Pure static hosts with **no functions** (e.g. plain GitHub Pages) cannot do online GitHub login — use **local editing** (`npm run cms`) instead, or move the site to Vercel/Netlify/Cloudflare for `/api` auth.
