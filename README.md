# Alexandre Guichet — Portfolio

Interactive React portfolio for **Alexandre Guichet**: game composition, level design, and Azure DevOps.

**Live:** [portfolio-five-steel-37.vercel.app](https://portfolio-five-steel-37.vercel.app/)

## Edit without coding (any host)

Visual editor at **`/admin/`** — on the live site or locally.

- **Friend guide:** [docs/EDITING.md](./docs/EDITING.md)
- **Owner setup:** [docs/ADMIN-SETUP.md](./docs/ADMIN-SETUP.md)

```bash
npm run dev   # site
npm run cms   # local editor backend (other terminal)
# then open http://localhost:5173/admin/
```

## Stack

- Vite + React + TypeScript
- Framer Motion + React Router
- Decap CMS (GitHub-backed, host-agnostic)
- Deploy anywhere that can serve the static app (+ optional `/api` for online login)

## Build

```bash
npm install
npm run build
npm run preview
```
