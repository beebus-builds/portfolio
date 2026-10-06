# Devverse — Bibash Poudel's portfolio

A space-age portfolio site: the classic multi-page site at `/`, plus an interactive
3D space flight at `/flight` where every section is a planet you dock with.

Built with Next.js 16 (App Router), React 19, three.js / react-three-fiber, Tailwind CSS 4,
and a Neon Postgres database for the contact inbox and per-visitor flight progress.

## Stack

- **Framework:** Next.js 16, TypeScript, App Router
- **3D:** three.js, @react-three/fiber, @react-three/drei
- **Styling:** Tailwind CSS 4
- **DB:** Neon serverless Postgres (`@neondatabase/serverless`)
- **Tests:** Vitest
- **CI:** GitHub Actions (`.github/workflows/ci.yml`)

## Getting started

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL
npm run dev            # http://localhost:3002
```

### Environment variables

| Variable       | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `DATABASE_URL` | Neon Postgres connection string (required for APIs) |
| `ADMIN_TOKEN`  | Bearer token for the `/admin` message inbox         |

Tables are created on first request — no manual migrations needed for local dev.

## Scripts

| Command             | What it does                     |
| ------------------- | -------------------------------- |
| `npm run dev`       | Dev server on port 3002          |
| `npm run build`     | Production build                 |
| `npm start`         | Serve the production build       |
| `npm run lint`      | ESLint                           |
| `npm run typecheck` | `tsc --noEmit`                   |
| `npm test`          | Vitest unit/route tests          |

## Project layout

```
src/
  app/                 # routes: /, /about, /skills, /projects, /contact, /resume, /flight, /stats, /admin
    api/contact/       # contact form inbox (rate-limited, validated)
    api/progress/      # per-visitor flight progress (cookie-identified)
    api/stats/         # public aggregate stats for the /stats page
  components/site/     # classic site chrome (navbar, footer, cards)
  components/space/    # the 3D space experience (scene, ship, HUD, audio)
  hooks/               # shared hooks
  lib/                 # data + domain logic (profile, projects, simulation, db helpers)
```

## Notable bits

- Security headers in `next.config.ts` (nosniff, frame-deny, referrer & permissions policy).
- Contact endpoint: per-IP in-memory rate limiting + strict input validation.
- Progress endpoint: httpOnly visitor cookie, deduplicated/validated payloads, DB outage fallback.
- All DB access goes through the shared pool + schema helper in `src/lib/db.ts`.
