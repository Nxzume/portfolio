# Editing this portfolio (no React required)

All visitor-facing copy lives in this folder. Change a JSON file, save, and refresh the site (`npm run dev` or push for Vercel).

## Quick map

| What you want to change | File |
| --- | --- |
| Name, email, social links | `site.json` |
| Hero headline + background image | `hero.json` |
| About me text + portrait | `about.json` |
| Compose / Levels / Azure tabs | `focuses.json` |
| Music / score list | `sketches.json` |
| Score section titles | `score.json` |
| Projects section titles | `projects-section.json` |
| Contact buttons | `contact.json` |
| A game / project page | `projects/<slug>.json` |

Images go in `public/images/`. Audio goes in `public/audio/`.

## Add a new project

1. Copy `projects/_template.json` → `projects/my-game.json` (don’t keep the `_` prefix on the real file).
2. Fill in title, summary, sections, etc.
3. Put images in `public/images/` and point `image` / `gallery` to paths like `/images/my-game.png`.
4. Set `order` (lower numbers appear first).
5. The site creates a page at `/projects/my-game` automatically.

## Add new music

Edit `sketches.json` and append an entry:

```json
{
  "id": "boss-theme",
  "title": "Boss Theme",
  "mood": "Aggressive brass",
  "bpm": 128,
  "audio": "/audio/boss-theme.mp3"
}
```

1. Drop the file at `public/audio/boss-theme.mp3`.
2. Set `"audio"` to that path.
3. If `audio` is `""` or missing, the site plays a short generative placeholder tone instead (useful before real stems exist).

`baseFreq` + `pattern` only matter for generative placeholders.

## Edit About

Open `about.json`:

- `lead` — headline
- `body` — array of paragraphs
- `note` — optional smaller footnote (or delete the field)
- `portrait` — path under `public/`

## Tips

- Keep JSON valid (commas, quotes). A trailing comma will break the build.
- After editing, run `npm run build` locally if you want to double-check before pushing.
- `_template.json` is ignored by the site on purpose.
