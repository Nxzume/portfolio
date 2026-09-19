# Setup guide — Coolify + Cloudflare

This gets the site from this repo to `https://alexandreguichet.vancouverly.ca`
with the admin portal, git-backed publishing, and an always-on mirror.

Everything runs as **one Docker service** on Coolify. There is no database,
no Directus, and no S3 bucket to manage.

## Architecture in one paragraph

The container serves prerendered static pages plus a small admin API. When
you save in the admin, the server (1) rewrites the affected HTML files — the
change is live on your domain in about a second — and (2) commits `content/`
and `public/media/` to this repo via the GitHub API. On boot the container
pulls the latest content back from the repo, so restarts never lose edits.
Separately, a GitHub Action rebuilds the static site on every push and
deploys it to Cloudflare Pages, so a full copy of the site stays online even
if the Coolify server is down.

## 1. Make the repo private (do this first)

Content and media are committed to this repo, and the repo is currently
**public** — that would make everything in it browsable on GitHub.

GitHub → repo **Settings** → **Danger Zone** → **Change visibility** →
**Private**. Coolify keeps working (it authenticates with its own deploy key
or GitHub App).

## 2. Create the GitHub token (for publishing)

The server uses this to commit content edits to the repo.

1. Go to <https://github.com/settings/personal-access-tokens/new> (fine-grained token).
2. **Repository access:** "Only select repositories" → pick `nxzume/portfolio`.
3. **Permissions → Repository permissions → Contents:** `Read and write`.
   (Nothing else is needed.)
4. Generate and copy the token.

A classic PAT with the `repo` scope also works, but the fine-grained token is
better because it can only ever touch this one repo.

## 3. Deploy on Coolify

1. **New Resource → Application → from Git repository** — select this repo.
   - Branch: `master` once the PR is merged (or the PR branch to preview).
   - Build pack: **Dockerfile** (detected automatically).
   - Port: **3000**.
2. **Environment variables** (Runtime — none are needed at build time):

   | Variable | Required | Example | What it does |
   |---|---|---|---|
   | `ADMIN_PASSWORD` | yes | `…strong password…` | Password for `/admin`. Without it the admin is disabled. |
   | `GITHUB_TOKEN` | yes | `github_pat_…` | Token from step 2 — publishes edits to the repo. |
   | `GITHUB_REPO` | yes | `nxzume/portfolio` | Where content gets committed. |
   | `CONTENT_BRANCH` | yes | `master` | Branch content commits go to. Use the branch Coolify deploys. |
   | `ADMIN_SECRET` | optional | random 32+ chars | Signs session cookies. Defaults to `ADMIN_PASSWORD`. |
   | `SYNC_ON_BOOT` | optional | `true` (default) | Pull latest content from the repo on container start. |
   | `MAX_UPLOAD_MB` | optional | `20` | Upload size cap. |
   | `MEDIA_MAX_DIMENSION` | optional | `1920` | Images are resized to fit this box. |
   | `MEDIA_QUALITY` | optional | `82` | WebP quality for uploaded images. |

3. **No volumes and no databases** are needed — the repo is the store.
4. Health check path (if Coolify asks): `/healthz`. The image includes `curl` so Coolify's Docker healthcheck works.
5. Deploy.

> Keep Coolify's GitHub webhook ("Automatic deployment") **off** — content
> saves are live instantly without a rebuild, and every save commits to the
> repo; with auto-deploy on, each save would trigger a pointless multi-minute
> rebuild. Rebuilds are only needed for code changes (merge → manual
> redeploy). Boot sync covers restarts either way.

## 4. Point the Cloudflare tunnel at it

Your tunnel is already set up — just repoint the public hostname:

- `alexandreguichet.vancouverly.ca` → `http://<coolify-service-address>:3000`

Then browse to `https://alexandreguichet.vancouverly.ca/admin` and sign in.

**Recommended extra protection for `/admin`** (optional, one minute):
Cloudflare Zero Trust → Access → add an application covering the `/admin`
path with your email as the allowed identity. The portal already requires
the password and rate-limits login attempts; Access adds Cloudflare-login in
front of it.

## 5. The always-on mirror (failover)

A GitHub Action (`.github/workflows/mirror.yml`) rebuilds the static site on
every push to the content branch — including every admin save — and deploys
it to Cloudflare Pages.

One-time setup:

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   "Direct upload" → create an empty project named `portfolio-mirror`.
2. Cloudflare → **My Profile → API Tokens** → create a token from the
   "Edit Cloudflare Workers" template (or a custom token with
   `Cloudflare Pages: Edit` on your account).
3. Repo → **Settings → Secrets and variables → Actions**:
   - Secret `CF_API_TOKEN` = the token above
   - Secret `CF_ACCOUNT_ID` = account id from the dashboard sidebar
   - Variable `CF_PAGES_PROJECT` = `portfolio-mirror`
4. Done — the mirror lives at `https://portfolio-mirror.pages.dev` and
   updates ~1–2 minutes after every save. (Until the secrets exist, the
   Action still verifies the build and prints a notice.)

**When the Coolify server is down:** in Cloudflare DNS, switch the
`alexandreguichet` record from the tunnel to a CNAME for
`portfolio-mirror.pages.dev` (add the hostname as a custom domain on the
Pages project first). For automatic failover you can put both origins behind
a Cloudflare Load Balancer (paid add-on) — the manual DNS switch is free and
takes under a minute.

## 6. Day-to-day: editing the site

- Open `/admin`, sign in.
- The sidebar covers **everything**: site settings, hero, about, contact,
  the Music / projects section headers, focus tabs, sketch tracks, every
  project (title, slug, order, cover, summary, intro, highlights, links,
  sections with images and pull quotes, gallery), and the media library.
- **Music section:** paste a public Spotify artist / album / playlist / track
  URL under “Spotify embeds” — the live preview shows the player as you type.
  Clear the Spotify links to fall back to uploaded Sketch tracks.
- The right pane is a **live preview** rendered from your drafts — it updates
  as you type, before you save. **Click any section in the preview to jump to
  its editor.** Image fields show the actual image (and warn if the file is
  missing on the server).
- **Save & publish** writes the files, re-renders the pages (live in ~1s),
  and commits everything to GitHub. No redeploy needed for content changes.
- **Uploads:** any image/audio field has a "Media library" button — upload
  from your device or pick an existing file. Images are converted to WebP
  and capped at 1920px, so originals never leave your machine.
- **Media library:** lists every asset (uploads plus the site's images and
  audio). Any file can be deleted — the deletion is committed to the repo on
  the next publish, like any other change.
- **Links** (Site settings): each name + URL becomes a button in the Contact
  section. The name is the button label, shown exactly as you type it.
- **Projects:** `+` next to "Projects" adds a page; the ✎ / ✕ buttons rename
  or delete. New projects get a prerendered page and sitemap entry
  automatically.

## 7. What happens when…

- **Container restarts or is rebuilt:** boot sync pulls the latest content +
  media from the repo before serving. Nothing is lost.
- **Coolify server is down:** the Cloudflare Pages mirror keeps serving the
  full site; switch DNS per section 5.
- **The GitHub token expires:** the site keeps running and edits still go
  live locally; the status pill shows publish failures until you set a new
  token. Published-then-failed edits are re-committed on the next successful
  save (every publish syncs the full content state).
- **You push code changes:** merge to `master`; if Coolify auto-deploy is on,
  it rebuilds. Content is unaffected either way.

## 8. About S3 (you asked)

You don't need it. Media is small, lives in the repo next to the content that
references it, is served by the same container, and is mirrored to Pages on
every save. S3/MinIO would only be worth adding if the media library grows
past roughly a gigabyte or you need to serve original-resolution files.

## 9. "Not obviously downloadable" — what's in place

- The repo (once private) is not browsable, so raw content and media aren't
  sitting on GitHub for anyone to scrape.
- Uploads are stored and served only as resized WebP — no originals.
- No directory listing, no public content/media API; the admin API requires
  the session cookie; `/admin` and `/api` send `noindex` and are excluded in
  `robots.txt`.
- Honest limit: anything a browser can display can be saved by a determined
  visitor (devtools, screenshots). These measures stop casual right-click and
  bulk downloading, which is the realistic goal for a public portfolio.

## 10. Local development

```bash
npm install
npm run dev          # vite dev server for the public site
npm run dev:server   # full server incl. /admin on :3000
```

For the full flow locally: `ADMIN_PASSWORD=dev GITHUB_TOKEN=… GITHUB_REPO=nxzume/portfolio CONTENT_BRANCH=<branch> npm run dev:server`.
