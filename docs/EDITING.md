# How to edit the portfolio (no coding)

This site has a **visual editor**. You do not need to touch code or JSON files.

## Open the editor

1. Go to: **https://portfolio-vercel-1406s-projects.vercel.app/admin**
2. Click **Login with GitHub**
3. Approve access the first time
4. You’ll see sections like **About me**, **Music tracks**, **Projects**

> First-time setup (GitHub login) is done by the site owner — see `docs/ADMIN-SETUP.md`.  
> You need a free GitHub account and write access to the portfolio repo.

## Everyday edits

| I want to… | In the editor, open… |
| --- | --- |
| Change my intro / photo | **Site pages → About me** |
| Change the big homepage headline | **Site pages → Hero** |
| Add or update music | **Site pages → Music tracks** |
| Add a new game / project | **Projects → New project** |
| Change contact buttons | **Site pages → Contact** |
| Change Compose / Levels / Azure text | **Site pages → Compose / Levels / Azure tabs** |

### Saving

1. Make your changes in the form fields  
2. Click **Publish** (or **Save**)  
3. Wait a minute or two for the live site to rebuild on Vercel  
4. Refresh the public site to see updates  

### Adding a photo

1. Use the **image** button / choose file in the form  
2. Pick a picture from your computer  
3. Publish  

### Adding a music file

1. Upload the file into the repo’s `public/audio/` folder (or ask the site owner to add it once)  
2. In **Music tracks**, set **Audio file path** to something like `/audio/my-song.mp3`  
3. Publish  

If audio path is empty, the site plays a short placeholder tone instead.

### Adding a project

1. **Projects → New project**  
2. Fill in title, summary, cover image, and sections  
3. Set **URL slug** (example: `new-game` → page will be `/projects/new-game`)  
4. Publish  

## Tips

- Write normally — short paragraphs are best  
- You can’t break the site by editing text in the admin  
- If something looks wrong after publishing, tell the site owner; changes can be undone in GitHub  

## Need the old file-based guide?

Technical file layout still lives in `content/README.md` — only needed if someone edits files directly.
