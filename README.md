# Devverse — Bibash Poudel's portfolio

An interactive city-builder portfolio. Landing on `/` drops you into a growing
city — **Bibashville** — where each district holds a part of the story. It is a
real landing page you can explore, backed by eight classic, text-first pages
(`/about`, `/skills`, `/projects`, `/contact`, `/services`, `/experience`,
`/resume` and `/stats`) plus the blog at `/blog` and an admin inbox at `/admin`.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, and a Neon Postgres
database for the contact inbox and blog posts.

## Stack

- **Framework:** Next.js 16, TypeScript, App Router
- **Landing page:** an interactive city sim built with React and the DOM
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
    page.tsx           # the city-builder landing page
    about/ skills/ projects/ contact/       # classic pages
    services/ experience/ resume/ stats/    # classic pages
    loading.tsx        # route-transition loading screen
    blog/              # the blog (DB-backed with a static fallback)
    admin/             # token-gated message inbox + post editor
    api/               # contact, stats, cover and other helpers
  components/site/     # shared chrome and page blocks for the classic pages
  components/city/     # the city simulation and its controls
  hooks/               # shared hooks
  lib/                 # data + domain logic (profile, projects, city sim, db helpers)
```

## Routes

| Route         | What it is                                                    |
| ------------- | ------------------------------------------------------------- |
| `/`           | The city-builder landing page — explore the districts from here |
| `/about` `/skills` `/projects` `/contact` | Classic pages with the same content, no heavy 3D runtime required |
| `/services` `/experience` `/resume` `/stats` | Offer, work history, printable record and live city telemetry |
| `/blog`       | The blog — posts from Neon, static fallback                    |
| `/blog/[slug]`| A single post                                                 |
| `/admin`      | Bearer-token message inbox and post editor                    |

The landing page is the front door; the classic pages are the quiet, text-first
route into the same material. Every classic page has ten sections and shares the
same dark theme. Their content is defined once in `src/lib/sitePages.ts` and
rendered through `StandardPage`; the navbar and footer link straight to them.

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
- Stats counters are aggregated in Postgres, briefly cached at the API boundary,
  and fall back to zeroes if the database is unavailable. They are anonymous by
  design and describe activity, not identity.
- All DB access goes through the shared pool + schema helper in `src/lib/db.ts`.
