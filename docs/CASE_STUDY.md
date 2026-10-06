# Case study: Devverse — a portfolio that is also a space flight

**Live stack:** Next.js 16 · React 19 · TypeScript · three.js / R3F · Tailwind 4 · Neon Postgres · Vitest · GitHub Actions

## The problem

A conventional portfolio answers "what can you build?" by listing projects. It asks the
visitor to take the claim on faith. I wanted the portfolio itself to be the proof — a site
that demonstrates interface craft, real-time 3D, and a working backend in the act of being
browsed, with a completely conventional site available for anyone who'd rather skip the ship.

## The solution

Every section of the portfolio is a planet in a small solar system. Visitors fly a courier
ship between five worlds — About, Skills, Archive, Resume, Contact — dock, descend, and read.
The same content also renders as a fast, accessible, multi-route classic site.

Key architectural decisions:

- **One simulation, many renderers.** `src/lib/simulation.ts` owns positions, spins, ship
  state, heading, and docking targets as a plain mutable object. Both the 3D scene and the
  HUD read from it; React never re-renders per frame — `useFrame` mutates refs, React only
  renders on mode changes (intro / flight / docked / flat).
- **Graceful capability fallback.** The entry point probes for WebGL2/WebGL and falls back
  to a "flat explorer" DOM experience with identical content and progress tracking.
- **Server-backed progress.** An httpOnly visitor cookie identifies the pilot;
  `/api/progress` upserts visited planets and unlocked achievements into Neon. A DB outage
  degrades to empty progress rather than a broken flight.
- **Contact as a real endpoint.** `/api/contact` validates input, rate-limits per IP
  (in-memory, bounded), and stores messages — spam blunts itself instead of reaching me.
- **Observability for a portfolio.** A public `/stats` page aggregates pilots, docks,
  achievements, and messages; `/admin` surfaces the inbox behind a bearer token.

## Backend design

- `src/lib/db.ts` — single pooled Neon client, `ensureSchema` memoized per process with
  retry-on-failure, parameterized queries everywhere.
- Schema is created on first request, so a fresh environment is one request away from
  ready — no migration step needed for local dev.
- The admin inbox is token-protected (`ADMIN_TOKEN`), disallowed in `robots.txt`, and
  the token never touches the client bundle (checked per-request on the server).

## Frontend craft

- `SpaceScene` is a dynamically imported, client-only chunk; the boot spinner, planets,
  starfield, nebula, warp streaks, sun, and ship all live there. The classic site remains
  fully static.
- Framer Motion handles planet entry flashes, achievement toasts, and the intro sequence.
- A synthesized audio engine (no assets) reacts to boost and dock events.
- Cinematic mode on the homepage runs a slow orbital camera with no ship — the site is
  on-brand before you press a key.

## Quality bar

- **15 tests** (Vitest): API validation + rate limiting, progress persistence/fallback,
  and the simulation math.
- **CI on every push**: lint → typecheck → tests → production build.
- **Security headers** in `next.config.ts` and no unused deps in `package.json`.

## Outcome & lessons

- The dual-mode design forced content to be data-driven (`lib/profile.ts`,
  `lib/projects.ts`), which made the classic site, the 3D worlds, and the sitemap all
  read from the same source of truth.
- In-memory rate limiting is a deliberate trade-off: zero infrastructure, honest about
  its limits (per-instance), and documented in the route.
- Framing 3D as progressive enhancement rather than the site's only path kept Lighthouse
  scores, accessibility, and mobile usability respectable.

## What's next

- Email notifications for the contact inbox (Resend).
- Bundle budget monitoring for the three.js chunk.
- Per-visitor tour resumption: land on the planet you last docked with.
