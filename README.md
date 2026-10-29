# Devverse — Bibash Poudel's portfolio

A space-age portfolio site. **The site *is* the flight**: landing on `/` puts you
straight in the cockpit of an interactive 3D space flight where every section is a
planet you dock with. There is no landing page and no briefing screen in front of
it. The logbook at `/blog` and the admin inbox at `/admin` are the only other
routes.

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
  app/
    page.tsx           # the flight experience — this is the site
    loading.tsx        # route-transition loading screen
    blog/              # logbook (DB-backed with a static fallback)
    admin/             # token-gated message inbox + post editor
    api/               # contact, progress, stats, highscore, copilot, cover
  components/site/     # shared chrome for /blog and /admin
  components/space/    # the 3D experience (scene, ship, HUD, worlds, audio)
  hooks/               # shared hooks
  lib/                 # data + domain logic (profile, projects, simulation, db helpers)
```

## Routes

| Route         | What it is                                                    |
| ------------- | ------------------------------------------------------------- |
| `/`           | The flight, from the first frame. Deep links: `/?planet=about\|skills\|projects\|contact\|resume` |
| `/blog`       | The logbook — posts from Neon, static fallback                |
| `/blog/[slug]`| A single post                                                 |
| `/admin`      | Bearer-token message inbox and post editor                    |

`/` boots into flight immediately. The only branch is capability: without WebGL,
or with `prefers-reduced-motion`, it falls back to the flat explorer carrying the
same content. The **TEXT** button in the HUD switches to it at any time.

Old section URLs (`/about`, `/skills`, `/projects/...`, `/contact`, `/resume`,
`/experience`, `/stats`, `/flight`) permanently redirect (308) to the flight
world that now carries their content — see `next.config.ts`.

## Notable bits

See [docs/CASE_STUDY.md](docs/CASE_STUDY.md) for the full architecture write-up.

- Security headers in `next.config.ts` (nosniff, frame-deny, referrer & permissions policy).
- Contact endpoint: per-IP in-memory rate limiting + strict input validation. The
  in-memory limiter is best-effort — each server instance keeps its own buckets,
  which is enough to blunt casual spam on a single-region deployment. A guarantee
  needs infrastructure-level limits (WAF rules or a shared store such as Upstash
  Redis) once the site runs on more than one instance; that provisioning lives
  outside this repo.
- Server actions are protected by the framework: Next.js compares the request's
  `Origin` against the `Host` (or `X-Forwarded-Host`) and rejects mismatches, so
  CSRF needs no extra code on top — see the Server Actions guide bundled with
  the installed `next` version.
- Progress endpoint: httpOnly visitor cookie, deduplicated/validated payloads, DB outage fallback.
- All DB access goes through the shared pool + schema helper in `src/lib/db.ts`.
