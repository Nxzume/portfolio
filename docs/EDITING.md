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
| Top of homepage (name, headline, buttons) | **Site pages → Top of homepage** |
| About photo + bio | **Site pages → About me** |
| Contact title + buttons | **Site pages → Contact** |
| Name, email, itch/GitHub links | **Site pages → Name and links** |
| “Score desk” heading | **Site pages → Music section heading** |
| “Projects” heading | **Site pages → Projects section heading** |
| Compose / Levels / Azure switcher | **Site pages → Compose / Levels / Azure tabs** |
| Interactive music tracks | **Site pages → Music tracks** |
| A game write-up page | **Projects →** pick a project (or **New project**) — set **Page link name** for `/projects/…` |

### Photos
Use the image picker → choose or upload → **Publish**.

### Music files
Put a file in `public/audio/`, then set **Music file** to `/audio/my-song.mp3` → **Publish**.

---

## Field guide (what each box does)

Examples below match the live site style. You can rewrite them in your own voice.

### Site pages → Top of homepage

This is the first thing visitors see.

| Field | What it does | Example |
| --- | --- | --- |
| **Your name** | Big name at the top. Keep this strongest on the first screen. | `Alexandre Guichet` |
| **Main headline** | One clear line under your name. | `Music for worlds players inhabit.` |
| **Short line under the headline** | One short line of context. | `Composer for video games — also crafting level design and Azure DevOps systems.` |
| **Background photo** | Full-width image behind the top section. Prefer a clean gameplay or atmosphere shot. | `/images/level-gameplay.png` |
| **Main button → Button text** | Text on the main button. | `Hear sketches` |
| **Main button → Where it goes** | `#compose`, `#projects`, `#about`, or a full web address. | `#compose` |
| **Second button → Button text** | Quieter second button. | `View projects` |
| **Second button → Where it goes** | Same rules as the main button. | `#projects` |

---

### Site pages → About me

| Field | What it does | Example |
| --- | --- | --- |
| **Your photo** | Photo in the About section. | `/images/portrait.png` |
| **Short photo description** | For people who can’t see the image — usually your name. | `Alexandre Guichet` |
| **About headline** | Lead sentence above the bio. | `Alexandre Guichet builds worlds in sound, space, and systems.` |
| **Bio paragraphs** | Main bio. Add one entry per paragraph. Keep them short. | `This portfolio started as a Level Design journey…` |
| **Small note under the bio** | Optional smaller note (history, disclaimer). Leave blank if unused. | `Earlier copy mentioned UBC studies…` |

---

### Site pages → Contact

| Field | What it does | Example |
| --- | --- | --- |
| **Tiny label above the title** | Small text above the title. | `Contact` |
| **Contact title** | Contact section headline. | `Let’s talk scores, levels, or Azure.` |
| **Short description** | One short sentence under the title. | `Reach out for game composition, level design collaboration, or DevOps conversations.` |
| **Buttons** | Links shown as buttons. Add one entry per button. | see below |

**Each contact button:**

| Field | What it does | Example |
| --- | --- | --- |
| **Button text** | Text on the button. | `Email Alexandre` |
| **Email or web address** | `mailto:you@email.com` or `https://…` | `mailto:alexandre.g007@gmail.com` |
| **Button look** | **Strong (filled)** for the main one; **Quiet (outline)** for the others. | Strong (filled) |

---

### Site pages → Name and links

Shared name, email, and links used around the site.

| Field | What it does | Example |
| --- | --- | --- |
| **Your name** | Your name site-wide. | `Alexandre Guichet` |
| **One-line description** | Short one-liner about you. | `Composer for games — with level design craft and Azure DevOps depth.` |
| **Email address** | Plain email (no `mailto:`). | `alexandre.g007@gmail.com` |
| **itch.io page** | Full itch address. | `https://alexandreguichet.itch.io/level` |
| **The Arena on GitHub** | GitHub page for The Arena. | `https://github.com/keeganland/the-arena-agda` |
| **Level on GitHub** | GitHub page for Level. | `https://github.com/alexandreguichet/Level-Unity-CSharp` |

---

### Site pages → Music section heading

Only the heading above the interactive music player (not the tracks).

| Field | What it does | Example |
| --- | --- | --- |
| **Tiny label above the title** | Small text above the title. | `Score desk` |
| **Section title** | Section title. | `Interactive sketches` |
| **Short description** | Short explanation under the title. | `Press play to hear placeholder tones, or swap in real audio files.` |

---

### Site pages → Projects section heading

Heading above the project cards on the homepage.

| Field | What it does | Example |
| --- | --- | --- |
| **Tiny label above the title** | Small text. | `Level design` |
| **Section title** | Section title. | `Personal projects` |
| **Short description** | Short line under the title. | `Open a project for the full write-up.` |

---

### Site pages → Compose / Levels / Azure tabs

The three focus tabs on the homepage. Keep **three tabs** unless the site design changes too.

| Field | What it does | Example |
| --- | --- | --- |
| **Short tab name (no spaces)** | Prefer: `compose`, `levels`, `azure`. | `compose` |
| **Tab button text** | Text on the tab button. | `Compose` |
| **Headline when selected** | Title when that tab is open. | `Scores that carry a world` |
| **Paragraph when selected** | Paragraph under that headline. | `Alexandre produces music in his free time…` |

---

### Site pages → Music tracks

Each entry is one playable sketch.

| Field | What it does | Example |
| --- | --- | --- |
| **Short track name (no spaces)** | Internal short name. | `overture` |
| **Track title** | Name shown in the player. | `Overture — Title Screen` |
| **Mood line** | Short flavor line under the title. | `Warm brass · slow pulse` |
| **Tempo (beats per minute)** | How fast it feels. | `72` |
| **Music file** | Path to a real file. Leave **blank** for a simple placeholder sound. | `/audio/overture.mp3` or blank |
| **Placeholder starting pitch** | Only when Music file is blank. Starting pitch number. | `110` |
| **Placeholder note steps** | Only when Music file is blank. Numbers like `0`, `4`, `7` for a simple melody. | `0, 4, 7, 11, 7, 4` |

**Tip:** To add real music: put the file in `public/audio/`, set **Music file** to `/audio/your-file.mp3`, Publish.

---

### Projects → (each game / case study)

Homepage cards + full pages like `/projects/arena`.

| Field | What it does | Example |
| --- | --- | --- |
| **Short project name (no spaces)** | Internal short name. | `arena` |
| **Page link name** | Becomes `/projects/your-name`. Lowercase, no spaces. | `arena` → `/projects/arena` |
| **Homepage order** | Lower numbers appear first. | `1` for Level, `2` for Arena |
| **Project title** | Project name. | `The Arena` |
| **One-line subtitle** | Genre / status under the title. | `2D top-down RPG · in development` |
| **Cover photo** | Main image on the homepage card and project page. | `/images/arena-gameplay.png` |
| **Extra photos** | More images on the project page. | `/images/arena-detail-1.png` |
| **Short card summary** | Blurb on the homepage card. | `A succession of floors with their own mechanics…` |
| **Bullet highlights** | Bullet points (one each). | `Dual-character puzzle combat` |
| **Buttons** | Play / GitHub / etc. | Button text `GitHub`, web address `https://github.com/…` |
| **Opening paragraphs** | Top of the project page. | `The Arena is a 2D top-down RPG still in development…` |
| **Page chapters** | Longer sections further down. | see below |

**Each page chapter:**

| Field | What it does | Example |
| --- | --- | --- |
| **Short chapter name (no spaces)** | Short name for that block. | `level-design` |
| **Chapter title** | Section heading. | `Level design` |
| **Quote** | Optional pull-quote. Leave blank if unused. | `Spaces ask players to read the arena…` |
| **Paragraphs** | Body text (one entry per paragraph). | `Floors are designed as distinct mechanical chapters…` |
| **Photo** | Optional image for that chapter. | `/images/arena-gameplay.png` |
| **Photo description** | Short description of that image. | `The Arena gameplay — dual characters in combat` |

**New project checklist**

1. **Projects → New project**  
2. Set **Short project name** + **Page link name** (same simple word is fine, e.g. `my-game`)  
3. Add cover photo, summary, opening paragraphs, at least one chapter  
4. **Publish** → after deploy, open `/projects/my-game`

---

## After you Publish

- The admin saves a commit to GitHub.  
- Vercel rebuilds the site (usually a minute or two).  
- Hard-refresh the public page if you still see old text.
