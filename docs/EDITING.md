# How to edit the portfolio (no coding)

You do **not** need to touch code. Use the visual editor.

The editor works:
- on the **live website** (any host — Vercel, Netlify, custom domain)
- or on your **computer** (no hosting required)

## Option A — Edit on the live site

1. Open: `https://YOUR-SITE/admin/`  
   (ask the site owner for the exact link)
2. Click **Login with GitHub**
3. Edit sections like **About me**, **Music tracks**, **Projects**
4. Click **Publish**
5. Wait for the site to rebuild, then refresh the public page

You need a free GitHub account with access to the portfolio repo (the owner invites you once).

## Option B — Edit on your computer (no Vercel needed)

1. Install Node.js (LTS) if you don’t have it  
2. Clone the portfolio repo and open a terminal in that folder  
3. Run:

```bash
npm install
npm run dev
```

4. In a second terminal:

```bash
npm run cms
```

5. Open http://localhost:5173/admin/  
6. Edit → Publish  
7. Ask the owner to push/deploy, or push yourself if you have access  

## What to edit

| I want to… | In the editor, open… |
| --- | --- |
| Change my intro / photo | **Site pages → About me** |
| Change the big homepage headline | **Site pages → Hero** |
| Add or update music | **Site pages → Music tracks** |
| Add a new game / project | **Projects → New project** |
| Change contact buttons | **Site pages → Contact** |
| Change Compose / Levels / Azure text | **Site pages → Compose / Levels / Azure tabs** |

### Adding a photo

Use the image picker in the form → choose a file → Publish.

### Adding music

1. Put an mp3/wav in `public/audio/` (or ask the owner once)  
2. In **Music tracks**, set **Audio file path** to `/audio/my-song.mp3`  
3. Publish  

Empty audio path = short placeholder tone.

### Adding a project

1. **Projects → New project**  
2. Fill title, summary, images, sections  
3. Set **URL slug** (example: `new-game` → `/projects/new-game`)  
4. Publish  

## Tips

- Write normally; short paragraphs work best  
- Publishing cannot “break” the React app — worst case, revert a GitHub commit  
- If the live `/admin` login fails, use Option B on your computer  

Setup details for the site owner: `docs/ADMIN-SETUP.md`.
