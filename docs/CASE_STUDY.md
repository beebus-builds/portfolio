# Case study: Devverse — a portfolio that is also a space flight

**Live stack:** Next.js 16 · React 19 · TypeScript · three.js / R3F · Tailwind 4 · Neon Postgres · Vitest · GitHub Actions

## The problem

A conventional portfolio answers "what can you build?" by listing projects. It asks the
visitor to take the claim on faith. I wanted the portfolio itself to be the proof — a site
that demonstrates interface craft, real-time 3D, and a working backend in the act of being
browsed, with a no-WebGL flat mode for anyone who'd rather skip the ship.

## The solution

The site *is* the flight. Landing on `/` puts you straight in the cockpit: every section of
the portfolio is a planet in a small solar system — About, Skills, Archive, Resume,
Contact — and you fly a courier ship between them, dock, descend, and read. There is no
landing page and no briefing screen: the first frame is the flight, because a
scroll-to-convince page in front of the thing being sold is a tax on the visitor.

Two decisions made that shape of the entry point:

- **Capability is the only branch.** No WebGL, or `prefers-reduced-motion`, drops
  straight to the flat explorer with identical content. There is no "are you sure?"
  interstitial, so the fallback is reachable by anyone with one HUD button.
- **The briefing was cut, not just moved.** Its destination picker was redundant —
  the HUD already carries a button per world — and its "launch" click was the only
  thing firing the Ignition medal. That medal now fires on capability resolution
  instead, which is the moment the ship is genuinely in the air.

Key architectural decisions:

- **One simulation, many renderers.** `src/lib/simulation.ts` owns positions, spins, ship
  state, heading, and docking targets as a plain mutable object. Both the 3D scene and the
  HUD read from it; React never re-renders per frame — `useFrame` mutates refs, React only
  renders on mode changes (flight / docked / flat).
- **Graceful capability fallback.** The entry point probes for WebGL2/WebGL and falls back
  to a "flat explorer" DOM experience with identical content and progress tracking.
- **Real imagery, procedural fallback.** Planetary surfaces, the Milky Way sky and the
  image-based lighting environment come from NASA-derived CC BY 4.0 maps (see
  [ASSET_CREDITS.md](ASSET_CREDITS.md)). Every one of them degrades to a procedural
  texture if the file is missing, so a dropped asset is never a hole in the scene.
- **Server-backed progress.** An httpOnly visitor cookie identifies the pilot;
  `/api/progress` upserts visited planets and unlocked achievements into Neon. A DB outage
  degrades to empty progress rather than a broken flight.
- **Contact as a real endpoint.** `/api/contact` validates input, rate-limits per IP
  (in-memory, bounded), and stores messages — spam blunts itself instead of reaching me.
  The form lives inside the contact world, so it is reachable without leaving the flight.
- **The inbox is the only admin surface.** `/admin` surfaces messages and the post editor
  behind a bearer token; there is no public telemetry page to leak visitor counts.

## Backend design

- `src/lib/db.ts` — single pooled Neon client, `ensureSchema` memoized per process with
  retry-on-failure, parameterized queries everywhere.
- Schema is created on first request, so a fresh environment is one request away from
  ready — no migration step needed for local dev.
- The admin inbox is token-protected (`ADMIN_TOKEN`), disallowed in `robots.txt`, and
  the token never touches the client bundle (checked per-request on the server).

## Frontend craft

- `SpaceScene` is a dynamically imported, client-only chunk; the boot spinner, planets,
  starfield, nebula, warp streaks, sun, and ship all live there.
- Framer Motion handles planet entry flashes, achievement toasts, and the intro sequence.
- A synthesized audio engine (no assets) reacts to boost and dock events.
- Camera standoffs are sized against the airframe, not tuned by eye. The ship
  geometry is authored at ~29 units long; an early 30-unit chase standoff put the
  camera inside the fuselage and the craft read as a speck. The rig also starts
  already framed on the ship rather than lerping in from a default, so the first
  painted frame is the intended composition.

## Quality bar

- **55 tests** (Vitest): API validation + rate limiting, progress persistence/fallback,
  the simulation math, and the ship geometry builders.
- **CI on every push**: lint → typecheck → tests → production build.
- **Security headers** in `next.config.ts` and no unused deps in `package.json`.

## Outcome & lessons

- Making the flight the *only* front door removed the temptation to let the classic site
  drift out of sync — there is one source of truth ( `lib/profile.ts`,
  `lib/projects.ts`) and one renderer tree, so the 3D worlds and the sitemap cannot
  disagree.
- Six of the eight projects have no public deployment. Saying "source only — no public
  deployment" on the case study beats hiding the link and letting a visitor assume it
  exists somewhere.
- Deprecating the old section URLs with 308 redirects into the matching world kept every
  existing link and search result working instead of 404ing.
- In-memory rate limiting is a deliberate trade-off: zero infrastructure, honest about
  its limits (per-instance), and documented in the route.
- Framing 3D as progressive enhancement rather than the site's only path kept Lighthouse
  scores, accessibility, and mobile usability respectable.

## What's next

- Email notifications for the contact inbox (Resend).
- Bundle budget monitoring for the three.js chunk.
- Per-visitor tour resumption: land on the planet you last docked with.
