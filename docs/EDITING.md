# How to edit the portfolio (no coding)

Live site: **https://portfolio-five-steel-37.vercel.app/**

## Option A — Edit on the live site

1. Open https://portfolio-five-steel-37.vercel.app/admin/  
2. **Login with GitHub**  
3. Edit About / music / projects → **Publish**  
4. Wait for Vercel to rebuild, then refresh the public site  

(First-time GitHub login setup is done by the site owner — `docs/ADMIN-SETUP.md`.)

## Option B — Edit on your computer (no Vercel login needed)

```bash
npm install
npm run dev
# other terminal:
npm run cms
```

Open http://localhost:5173/admin/

## What to edit

| I want to… | Open… |
| --- | --- |
| Intro / photo | **Site pages → About me** |
| Homepage headline | **Site pages → Hero** |
| Music | **Site pages → Music tracks** |
| New game / project | **Projects → New project** |
| Contact buttons | **Site pages → Contact** |
| Compose / Levels / Azure tabs | **Site pages → Compose / Levels / Azure tabs** |

### Photos
Use the image picker → Publish.

### Music
Put a file in `public/audio/`, set path like `/audio/my-song.mp3`, Publish.

### New project
Fill title, slug (`/projects/your-slug`), images, sections → Publish.
