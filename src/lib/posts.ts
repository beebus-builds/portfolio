export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  minutes: number;
  body: string[];
}

export const posts: Post[] = [
  {
    slug: "homomorphic-voting-notes",
    title: "Notes on shipping an encrypted voting platform",
    date: "2026-09-12",
    excerpt:
      "Paillier encryption sounds like a whitepaper, but the real work is the chicken-and-egg problem: you need the tally to be correct and nobody — including you — to see the votes.",
    tags: ["Cryptography", "Security", "Lessons"],
    minutes: 6,
    body: [
      "The pitch was simple: encrypt every ballot so neither the server, nor an admin, nor an attacker can trace a vote back to a voter. The implementation was a semester of small, sharp lessons.",
      "Paillier homomorphic encryption is the trick that makes it possible: the server adds ciphertexts together and never decrypts a single ballot. Only the aggregate tally is decrypted — and the private key erases itself the moment it is used.",
      "The hardest part was not the math. It was the liveness gate: every voter had to prove they were a live human at the ballot box. Blink-based liveness stopped the deepfake attempts we threw at it, and it shipped as one pre-vote step instead of a separate app.",
      "If you are building anything where privacy is a promise, write the threat model first. Impersonation, vote-buying, and tampered tallies were the three attacks we designed against — everything else was implementation.",
    ],
  },
  {
    slug: "gpx-on-a-phone",
    title: "Parsing GPX tracks so they feel instant on a phone",
    date: "2026-08-03",
    excerpt:
      "Elevation profiles felt sluggish until I moved parsing into the browser and stopped apologizing for mountains.",
    tags: ["Performance", "Maps"],
    minutes: 4,
    body: [
      "Open Trails started with a complaint from a friend: the elevation chart for a 40km track took five seconds on mid-range hardware. Five seconds is a lifetime at a trailhead.",
      "The fix was structural, not cosmetic. I moved GPX parsing into the browser, parsed once, and kept the derived path in a typed array instead of re-walking the DOM on every render.",
      "The chart now draws from ~2000 points per track with a downsampling pass for the visible window. On a three-year-old phone the profile appears in under 300ms.",
      "Lesson logged: for local-first tools, parse at the edge of the system — the browser, the device — and keep the hot path free of network and framework overhead.",
    ],
  },
  {
    slug: "wordpress-honest-audits",
    title: "The audit fixes WordPress sites need every month",
    date: "2026-06-21",
    excerpt:
      "Most WordPress emergencies are the same five tickets wearing different costumes. A checklist beats a fire drill.",
    tags: ["WordPress", "Maintenance"],
    minutes: 5,
    body: [
      "After a dozen client audits, the same five problems kept showing up. That observation is the whole origin story of the Himalayan Plugin.",
      "One: unoptimized media and missing caching headers. Two: plugins doing the job of one query. Three: outdated PHP quietly failing in a corner. Four: compliance pages that were never updated. Five: backups nobody had ever restored.",
      "The checklist approach beats heroics. Each fix is a toggleable routine with safe defaults, and the admin screen reads like a to-do list instead of a config dump.",
      "The goal of maintenance software is to make the right thing the default. When the audit takes an afternoon instead of a week, people actually run it.",
    ],
  },
  {
    slug: "three-oceans-portfolio",
    title: "Why this portfolio is a solar system, not a template",
    date: "2026-05-10",
    excerpt:
      "Templates are for borrowing. A 3D flight deck is for remembering. The thinking behind building a portfolio you can actually fly through.",
    tags: ["Three.js", "Design"],
    minutes: 7,
    body: [
      "A portfolio has one job: make the person reading it remember the person behind it. Templates optimize for the opposite — blending in.",
      "So I built the site around a ship. Five planets, each one a section: who I am, what I can build, the work I shipped, how to reach me, and the printed record of it all. Steering the ship is the navigation.",
      "The flight view is opt-in. Every planet also opens as a classic, readable page — the document is always one link away. The spectacle explains itself through interaction, not a wall of motion sickness.",
      "React Three Fiber made the scene approachable: planets as components, cameras as props, input as a hook. The stack beneath the cockpit is the stack in the case studies - that overlap is the point.",
    ],
  },
  {
    slug: "devverse-case-study",
    title: "Case study: Devverse, a portfolio that proves its stack",
    date: "2026-10-06",
    excerpt:
      "One mutable simulation driving a 3D scene and a HUD, progress persisted in Neon, a rate-limited contact API, tests and CI — the plumbing behind the flight deck.",
    tags: ["Next.js", "TypeScript", "Postgres", "Testing"],
    minutes: 8,
    body: [
      "A conventional portfolio asks visitors to take its claims on faith. I wanted the site itself to be the proof: interface craft, real-time 3D, and a working backend all demonstrated in the act of being browsed — with a completely conventional site one link away.",
      "The core of the 3D mode is a single simulation object. Planet positions, ship state, heading, and docking targets all live on one plain mutable object that the 3D scene and the HUD both read. React never re-renders per frame: useFrame mutates refs, and React only renders on mode changes — intro, flight, docked, flat.",
      "The flight view is progressive enhancement. A WebGL probe at startup falls back to a flat explorer with identical content and identical progress tracking, so the planetary concept survives a bad GPU or a stern company laptop.",
      "Progress is server-backed. An httpOnly visitor cookie identifies the pilot, and /api/progress upserts visited planets and unlocked achievements into Neon. If the database is down, the flight degrades to empty progress instead of an error screen.",
      "The contact endpoint validates input strictly and rate-limits per IP with an in-memory, bounded map — honest about its limits (per instance), zero infrastructure, spam that blunts itself before it reaches the inbox. Messages land in Postgres with timestamps, viewable at /admin behind a bearer token.",
      "A public /stats page aggregates pilots, total docks, achievements, and messages. It is the same data the admin inbox sees, minus anything private — a nice story about sharing telemetry without sharing people.",
      "Every DB query goes through one pooled client in src/lib/db.ts, with schema creation memoized per process. A fresh environment is one request away from a ready database.",
      "Quality bar: 15 Vitest tests covering API validation, rate limiting, progress fallback, and the simulation math; CI running lint, typecheck, tests, and a production build on every push; security headers in next.config. Full write-up in docs/CASE_STUDY.md.",
    ],
  },
];
