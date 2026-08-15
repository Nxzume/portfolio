# How to edit the portfolio (no coding)

Live site: **https://portfolio-five-steel-37.vercel.app/**

## Option A — Edit on the live site

1. Open https://portfolio-five-steel-37.vercel.app/admin/  
2. **Login with GitHub**  
3. Open an entry below → change text/images → **Publish**  
4. Wait for Vercel to rebuild, then refresh the public site  

(First-time setup: `docs/ADMIN-SETUP.md`.)

## Option B — Edit on your computer

```bash
npm install
npm run dev
# other terminal:
npm run cms
```

Open http://localhost:5173/admin/

---

## Quick map

| I want to change… | Open in admin… |
| --- | --- |
| Top of homepage (name, headline, buttons) | **Site pages → Hero** |
| About photo + bio | **Site pages → About me** |
| Contact title + buttons | **Site pages → Contact** |
| Name, email, itch/GitHub links | **Site pages → Site settings** |
| “Score desk” section titles | **Site pages → Music section titles** |
| “Projects” section titles | **Site pages → Projects section titles** |
| Compose / Levels / Azure switcher | **Site pages → Compose / Levels / Azure tabs** |
| Interactive music tracks | **Site pages → Music tracks** |
| A game write-up page | **Projects →** pick a project (or **New project**) |

### Photos
Use the image picker → choose or upload → **Publish**.

### Music files
Put a file in `public/audio/`, then set the path like `/audio/my-song.mp3` → **Publish**.

---

## Field guide (what each box does)

Examples below match the live site style. You can rewrite them in your own voice.

### Site pages → Hero (top of homepage)

This is the first thing visitors see.

| Field | What it does | Example |
| --- | --- | --- |
| **Brand name** | Big name / brand at the top. Keep this strongest in the first screen. | `Alexandre Guichet` |
| **Headline** | One clear line under the brand. | `Music for worlds players inhabit.` |
| **Short supporting sentence** | One short line of context under the headline. | `Composer for video games — also crafting level design and Azure DevOps systems.` |
| **Background image** | Full-bleed image behind the hero. Prefer a clean gameplay or atmosphere shot (no “DOWNLOAD” banners). | `/images/level-gameplay.png` |
| **Primary button → Label** | Main call-to-action text. | `Hear sketches` |
| **Primary button → Link** | Where that button goes. Use `#compose`, `#projects`, `#about`, or a full URL. | `#compose` |
| **Secondary button → Label** | Quieter second button. | `View projects` |
| **Secondary button → Link** | Same rules as primary link. | `#projects` |

---

### Site pages → About me

| Field | What it does | Example |
| --- | --- | --- |
| **Portrait photo** | Your photo in the About section. | `/images/portrait.png` |
| **Photo description (accessibility)** | Short alt text for screen readers. Say who/what is in the photo. | `Alexandre Guichet` |
| **Headline** | Lead sentence above the bio. | `Alexandre Guichet builds worlds in sound, space, and systems.` |
| **Paragraphs** | Main bio. Add one list item per paragraph. Keep paragraphs short. | `This portfolio started as a Level Design journey…` |
| **Optional footnote** | Smaller note under the bio (history, disclaimer, etc.). Leave blank if unused. | `Earlier copy mentioned UBC studies…` |

---

### Site pages → Contact

| Field | What it does | Example |
| --- | --- | --- |
| **Small label** | Tiny label above the title. | `Contact` |
| **Title** | Contact section headline. | `Let’s talk scores, levels, or Azure.` |
| **Description** | One short sentence under the title. | `Reach out for game composition, level design collaboration, or DevOps conversations.` |
| **Buttons** (list) | Links shown as buttons. Add one entry per button. | see below |

**Each contact button:**

| Field | What it does | Example |
| --- | --- | --- |
| **Button text** | Text on the button. | `Email Alexandre` |
| **Link (email or URL)** | `mailto:` for email, or a full `https://` link. | `mailto:alexandre.g007@gmail.com` |
| **Style** | `primary` = filled/strong; `ghost` = outline/quiet. Usually one primary + ghost for the rest. | `primary` |

---

### Site pages → Site settings

Used for shared name/email/links (footer and other shared spots).

| Field | What it does | Example |
| --- | --- | --- |
| **Display name** | Your name site-wide. | `Alexandre Guichet` |
| **Tagline** | Short one-liner about you. | `Composer for games — with level design craft and Azure DevOps depth.` |
| **Email** | Plain email (no `mailto:`). | `alexandre.g007@gmail.com` |
| **Links → itch.io** | Full itch URL. | `https://alexandreguichet.itch.io/level` |
| **Links → Arena GitHub** | Repo or org URL for The Arena. | `https://github.com/keeganland/the-arena-agda` |
| **Links → Level GitHub** | Repo URL for Level. | `https://github.com/alexandreguichet/Level-Unity-CSharp` |

---

### Site pages → Music section titles

Only the **heading block** for the interactive score desk (not the tracks themselves).

| Field | What it does | Example |
| --- | --- | --- |
| **Small label** | Tiny label above the title. | `Score desk` |
| **Title** | Section title. | `Interactive sketches` |
| **Description** | Short explanation under the title. | `Press play to hear placeholder tones, or swap in real audio files.` |

---

### Site pages → Projects section titles

Heading block above the project cards on the homepage.

| Field | What it does | Example |
| --- | --- | --- |
| **Small label** | Tiny label. | `Level design` |
| **Title** | Section title. | `Personal projects` |
| **Description** | Short line under the title. | `Open a project for the full write-up.` |

---

### Site pages → Compose / Levels / Azure tabs

The three focus tabs on the homepage. Keep **three tabs** unless you also update the site design to match.

| Field | What it does | Example |
| --- | --- | --- |
| **ID** | Internal id. Prefer: `compose`, `levels`, `azure`. Don’t use spaces. | `compose` |
| **Tab label** | Short text on the tab button. | `Compose` |
| **Headline** | Title shown when that tab is selected. | `Scores that carry a world` |
| **Body text** | Paragraph under that headline. | `Alexandre produces music in his free time and wants to be hired as a composer for video games…` |

---

### Site pages → Music tracks

Each list item is one playable sketch in the Score desk.

| Field | What it does | Example |
| --- | --- | --- |
| **ID** | Unique id, no spaces. Used internally. | `overture` |
| **Title** | Track name shown in the UI. | `Overture — Title Screen` |
| **Mood / subtitle** | Short flavor line under the title. | `Warm brass · slow pulse` |
| **BPM** | Tempo number (beats per minute). Affects the placeholder player feel. | `72` |
| **Audio file path** | Path to a real file under `public/`. Leave **empty** to use a generated placeholder tone. | `/audio/overture.mp3` or blank |
| **Placeholder base frequency** | Only used when audio is empty. Starting pitch in Hz. | `110` |
| **Placeholder note pattern** | List of semitone steps for the placeholder melody (e.g. `0`, `4`, `7`). Optional. | `0, 4, 7, 11, 7, 4` |

**Tip:** To add real music: upload/put the file in `public/audio/`, set **Audio file path** to `/audio/your-file.mp3`, Publish.

---

### Projects → (each game / case study)

Homepage cards + full pages like `/projects/arena`.

| Field | What it does | Example |
| --- | --- | --- |
| **ID** | Unique id, no spaces. | `arena` |
| **Page link name** | Becomes `/projects/your-name`. Lowercase, no spaces. | `arena` → `/projects/arena` |
| **Sort order** | Lower numbers appear first on the homepage. | `1` for Level, `2` for Arena |
| **Title** | Project name. | `The Arena` |
| **Subtitle** | One-line genre / status under the title. | `2D top-down RPG · in development` |
| **Cover image** | Main image on the homepage card and project page. | `/images/arena-gameplay.png` |
| **Gallery images** | Extra images on the project page. Add one per image. | `/images/arena-detail-1.png` |
| **Short summary** | Card blurb on the homepage (keep it short). | `A succession of floors with their own mechanics…` |
| **Highlights** | Bullet points (one item each). | `Dual-character puzzle combat` |
| **Links** | Buttons like Play / GitHub. | Label `GitHub`, URL `https://github.com/…` |
| **Intro paragraphs** | Opening paragraphs at the top of the project page. | `The Arena is a 2D top-down RPG still in development…` |
| **Page sections** | Longer chapters further down the page. | see below |

**Each page section:**

| Field | What it does | Example |
| --- | --- | --- |
| **Section ID** | Unique id for that block (no spaces). | `level-design` |
| **Heading** | Section title. | `Level design` |
| **Quote (optional)** | Pull-quote if you want one. Leave blank if unused. | `Spaces ask players to read the arena…` |
| **Paragraphs** | Body text for that section (one item per paragraph). | `Floors are designed as distinct mechanical chapters…` |
| **Image (optional)** | Image for that section. | `/images/arena-gameplay.png` |
| **Image caption** | Alt text / short caption for that image. | `The Arena gameplay — dual characters in combat` |

**New project checklist**

1. **Projects → New project**  
2. Set **ID** + **Page link name** (same simple word is fine, e.g. `my-game`)  
3. Add cover image, summary, intro, at least one section  
4. **Publish** → after deploy, open `/projects/my-game`

---

## After you Publish

- The admin saves a commit to GitHub.  
- Vercel rebuilds the site (usually a minute or two).  
- Hard-refresh the public page if you still see old text.
