# One-time admin setup (site owner)

This unlocks the visual editor at `/admin` for Alexandre (or anyone you invite).

## 1. Invite your friend on GitHub

1. Open https://github.com/Nxzume/portfolio  
2. **Settings → Collaborators → Add people**  
3. Invite Alexandre’s GitHub username  
4. They accept the email invite  

They need **write** access so Publish can save changes.

## 2. Create a GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**  
2. Fill in:
   - **Application name:** Portfolio CMS  
   - **Homepage URL:** `https://portfolio-vercel-1406s-projects.vercel.app`  
   - **Authorization callback URL:** `https://portfolio-vercel-1406s-projects.vercel.app/api/callback`  
3. Register → copy **Client ID** → generate **Client Secret**

If you use a custom domain later, update Homepage + Callback to that domain and change `base_url` in `public/admin/config.yml`.

## 3. Add secrets in Vercel

In the Vercel project → **Settings → Environment Variables**:

| Name | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | from the OAuth App |
| `GITHUB_CLIENT_SECRET` | from the OAuth App |

Redeploy the project after saving.

## 4. Smoke test

1. Visit `https://portfolio-vercel-1406s-projects.vercel.app/admin`  
2. Login with GitHub (use an account that can push to `Nxzume/portfolio`)  
3. Edit **About me** → Publish  
4. Confirm a commit appears on `master` and the site updates  

## Local testing (optional)

```bash
npm run dev
# in another terminal:
npx decap-server
```

Then set `local_backend: true` temporarily in `public/admin/config.yml` and open http://localhost:5173/admin  

Remember to turn `local_backend` off again before production use.
