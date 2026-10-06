export interface PostSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  code?: { lang: string; snippet: string };
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  minutes: number;
  /** Lead paragraphs, rendered before the sections. */
  body: string[];
  sections?: PostSection[];
  /** Pull quote shown mid-article. */
  quote?: string;
  cover: { src: string; alt: string };
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
    cover: {
      src: "/blog/homomorphic-voting-notes.svg",
      alt: "Concentric range arcs sweeping from a horizon grid, in violet on deep blue",
    },
    body: [
      "The pitch was simple: encrypt every ballot so neither the server, nor an admin, nor an attacker can trace a vote back to a voter. The implementation was a semester of small, sharp lessons.",
      "Paillier homomorphic encryption is the trick that makes it possible: the server adds ciphertexts together and never decrypts a single ballot. Only the aggregate tally is decrypted — and the private key erases itself the moment it is used.",
      "The hardest part was not the math. It was the liveness gate: every voter had to prove they were a live human at the ballot box. Blink-based liveness stopped the deepfake attempts we threw at it, and it shipped as one pre-vote step instead of a separate app.",
    ],
    quote:
      "If you are building anything where privacy is a promise, write the threat model first. Everything after that is implementation.",
    sections: [
      {
        heading: "The liveness gate was the real product",
        paragraphs: [
          "We spent two weeks on the cryptography and about six on the liveness check, which tells you where the risk actually lived. The attack surface was not the cipher, it was proving that a ballot came from a living person standing in front of a screen.",
          "The first version asked for a blink, a head turn, and a spoken phrase. That third requirement caused more failures than the other two combined, so it went: random prompts generated server-side, replay-protected, and audited in the same transaction as the encrypted vote.",
        ],
        bullets: [
          "Challenges are generated per session and signed, so a recorded video of one prompt cannot answer a different prompt.",
          "Vote submission and challenge completion commit in one database transaction — no half-finished ballots.",
          "The private key is derived at tally time and zeroed immediately after, so a running server never holds it.",
        ],
      },
      {
        heading: "What I would tell my past self",
        paragraphs: [
          "Write the abuse cases before the happy path. We built a beautiful voting UI and then spent a week imagining someone submitting ten thousand ballots from a script. Every one of those imagination exercises became a test.",
          "The second thing: make the privacy claim legible. People do not trust a promise they cannot see. Showing the ciphertext round-trip in the UI — vote encrypted, tally aggregate-only — did more for perceived integrity than any amount of copy about military-grade encryption.",
        ],
        code: {
          lang: "ts",
          snippet:
            "// Tally without ever decrypting a single ballot.\nconst encrypted = ballots.map((b) => encrypt(b.choice, publicKey));\nconst total = encrypted.reduce((acc, c) => addCiphertexts(acc, c), zeroCipher());\nconst { result } = decrypt(total, privateKey); // key zeroed right after",
        },
      },
      {
        heading: "Takeaways",
        paragraphs: [
          "Homomorphic encryption is the easy part in the sense that libraries exist and the maths is documented. Everything around it — liveness, auditability, honest UX — is the actual engineering, and it is where the time goes.",
        ],
      },
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
    cover: {
      src: "/blog/gpx-on-a-phone.svg",
      alt: "Stacked translucent panels with a small bar chart, in mint on deep blue",
    },
    body: [
      "Open Trails started with a complaint from a friend: the elevation chart for a 40km track took five seconds on mid-range hardware. Five seconds is a lifetime at a trailhead.",
      "The fix was structural, not cosmetic. I moved GPX parsing into the browser, parsed once, and kept the derived path in a typed array instead of re-walking the DOM on every render.",
      "The chart now draws from ~2000 points per track with a downsampling pass for the visible window. On a three-year-old phone the profile appears in under 300ms.",
    ],
    quote:
      "For local-first tools, parse at the edge of the system — the browser, the device — and keep the hot path free of network and framework overhead.",
    sections: [
      {
        heading: "Where the five seconds actually went",
        paragraphs: [
          "Profiling said almost none of it was in the XML parse. The cost was React: every hover on the chart re-rendered the whole track component, which meant re-diffing thousands of SVG path segments per pointer move.",
          "So the fix had two halves. Decouple sampling from rendering — only redraw the visible window — and stop React from owning the hot path entirely.",
        ],
        code: {
          lang: "ts",
          snippet:
            "// 8k points in, ~200 on screen: bucket by pixel column, keep the extremum.\nfunction downsample(points: Pt[], width: number): Pt[] {\n  const step = points.length / width;\n  const out: Pt[] = [];\n  for (let i = 0; i < width; i++) {\n    const slice = points.slice(Math.floor(i * step), Math.floor((i + 1) * step));\n    out.push(slice.reduce((a, b) => (b.ele > a.ele ? b : a)));\n  }\n  return out;\n}",
        },
      },
      {
        heading: "The unglamorous part that mattered most",
        paragraphs: [
          "Files open straight from the device with a file input. No upload, no server round trip, no account. The app works on a plane, which is exactly when people actually want to look at the map they downloaded.",
          "That constraint is what made the performance work necessary rather than optional. There is no spinner to hide behind when there is no network.",
        ],
        bullets: [
          "Parse once on load, memoize the derived series.",
          "Downsample to pixel columns, never to a fixed point count.",
          "Keep the pointer interaction on canvas; keep React for everything else.",
        ],
      },
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
    cover: {
      src: "/blog/wordpress-honest-audits.svg",
      alt: "Radar sweep with concentric arcs over a data bar row, in amber on deep blue",
    },
    body: [
      "After a dozen client audits, the same five problems kept showing up. That observation is the whole origin story of the Himalayan Plugin.",
      "One: unoptimized media and missing caching headers. Two: plugins doing the job of one query. Three: outdated PHP quietly failing in a corner. Four: compliance pages that were never updated. Five: backups nobody had ever restored.",
      "The checklist approach beats heroics. Each fix is a toggleable routine with safe defaults, and the admin screen reads like a to-do list instead of a config dump.",
    ],
    quote:
      "The goal of maintenance software is to make the right thing the default. When the audit takes an afternoon instead of a week, people actually run it.",
    sections: [
      {
        heading: "The five, in order of how often they caused pain",
        paragraphs: [
          "Media and caching came first by a distance. A 4MB hero image served uncompressed on every page load is the single most common finding, and it is also the easiest fix — a few headers and a resize pass.",
          "Plugin sprawl came second. The pattern was always the same: five plugins each fetching post meta, each with its own cache, all disagreeing about what a page contains.",
        ],
        bullets: [
          "Media: resize, convert, and serve with the right cache headers.",
          "Queries: replace five plugins doing one job with one cached function.",
          "Runtime: update PHP and the stack, then read the error log properly.",
          "Compliance: privacy and cookie pages that still match reality.",
          "Backups: restore one into staging. If that fails, you do not have backups.",
        ],
      },
      {
        heading: "Designing the admin screen",
        paragraphs: [
          "The plugin's whole interface is a checklist with severity markers and a fix button per row. No dashboards of vanity metrics, no upsells for a free maintenance task. It is deliberately boring, because the person using it is usually already stressed.",
          "One detail that mattered: every check explains itself in a sentence and links to the reasoning. A tool that says fix this without saying why gets ignored, and ignored maintenance is the same as no maintenance.",
        ],
        code: {
          lang: "php",
          snippet:
            "add_action( 'admin_menu', function () {\n    add_menu_page( 'Himalayan', 'Site Health', 'manage_options', 'himalayan', 'bp_himalayan_screen' );\n} );\n\n// Each row: severity, one-sentence reason, one fix callback. No exceptions.",
        },
      },
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
    cover: {
      src: "/blog/three-oceans-portfolio.svg",
      alt: "Orbiting satellites circling a small bright core, in sky blue on deep navy",
    },
    body: [
      "A portfolio has one job: make the person reading it remember the person behind it. Templates optimize for the opposite — blending in.",
      "So I built the site around a ship. Five planets, each one a section: who I am, what I can build, the work I shipped, how to reach me, and the printed record of it all. Steering the ship is the navigation.",
      "The flight view is opt-in. Every planet also opens as a classic, readable page — the document is always one link away. The spectacle explains itself through interaction, not a wall of motion sickness.",
    ],
    quote:
      "React Three Fiber made the scene approachable: planets as components, cameras as props, input as a hook. The stack beneath the cockpit is the stack in the case studies.",
    sections: [
      {
        heading: "The rule that kept it honest",
        paragraphs: [
          "Every planet has a real page behind it. The 3D view is a navigation layer over ordinary routes, not a replacement for them. That constraint means the site never becomes a toy that happens to contain no content.",
          "It also made accessibility almost free. Someone using a screen reader, or someone on a machine where WebGL is disabled, lands on the document version and misses nothing except the flourish.",
        ],
      },
      {
        heading: "Performance is an architectural constraint",
        paragraphs: [
          "The scene holds a single mutable simulation object. Planet positions, ship state, heading, and docking targets live on one plain object that both the 3D scene and the HUD read. React never re-renders per frame — useFrame mutates refs, and React only renders on mode changes.",
          "That is the whole trick. Most 3D React projects die from state updates at 60Hz. Avoiding them means one object, a render loop, and React only for things that change when a mode changes.",
        ],
        code: {
          lang: "tsx",
          snippet:
            "useFrame((state, delta) => {\n  sim.time += delta;\n  orbitPlanets(sim.time);\n  integrateShip(sim, delta, input);\n  hud.current.style.transform = `translate3d(${sim.ship.x}px, ${sim.ship.y}px, 0)`;\n});",
        },
        bullets: [
          "One mutable sim object; React never sees per-frame state.",
          "useFrame writes to refs and the HUD, never to component state.",
          "React re-renders on mode change only: intro, flight, docked, flat.",
        ],
      },
      {
        heading: "Would I build it this way again",
        paragraphs: [
          "Yes, with one change: I would ship the flat version first and add the flight deck as the enhancement it already is. The spectacle is the memorable part, but the document is the part that gets you hired.",
        ],
      },
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
    cover: {
      src: "/blog/devverse-case-study.svg",
      alt: "Stacked signal waves above a faint grid, in rose on deep blue",
    },
    body: [
      "A conventional portfolio asks visitors to take its claims on faith. I wanted the site itself to be the proof: interface craft, real-time 3D, and a working backend all demonstrated in the act of being browsed — with a completely conventional site one link away.",
      "The core of the 3D mode is a single simulation object. Planet positions, ship state, heading, and docking targets all live on one plain mutable object that the 3D scene and the HUD both read. React never re-renders per frame: useFrame mutates refs, and React only renders on mode changes — intro, flight, docked, flat.",
      "Everything else follows from that decision: the flat explorer is a second renderer over the same state, progress is persisted server-side so it survives a reload, and the contact endpoint is a real API rather than a mailto link.",
    ],
    quote:
      "A fresh environment is one request away from a ready database. That property is what makes a project demoable, not a nice-to-have.",
    sections: [
      {
        heading: "One simulation, two consumers",
        paragraphs: [
          "The WebGL scene and the flat explorer HUD read the same object. That is the entire trick behind the progressive enhancement story: the flat mode is not a lesser experience with different content, it is the same content driven by the same state through a different renderer.",
          "A WebGL probe at startup decides the mode. Bad GPU, stern company laptop, remote desktop — all of them fall through to the flat explorer with identical content and identical progress tracking.",
        ],
        code: {
          lang: "tsx",
          snippet:
            "function pickMode(): \"webgl\" | \"flat\" {\n  try {\n    const c = document.createElement(\"canvas\");\n    const gl = c.getContext(\"webgl2\") ?? c.getContext(\"webgl\");\n    return gl ? \"webgl\" : \"flat\";\n  } catch {\n    return \"flat\";\n  }\n}",
        },
      },
      {
        heading: "Progress that survives a dead database",
        paragraphs: [
          "An httpOnly visitor cookie identifies the pilot, and /api/progress upserts visited planets and unlocked achievements into Neon. If the database is down, the flight degrades to empty progress rather than an error screen.",
          "Every query goes through one pooled client in src/lib/db.ts with schema creation memoized per process. One request against a fresh environment is enough to have a working database.",
        ],
        bullets: [
          "httpOnly cookie for visitor identity — no fingerprinting, no third-party script.",
          "One pooled client, memoized schema creation, no connection storms on cold start.",
          "Database down means empty progress, never an error boundary.",
          "15 Vitest tests covering validation, rate limiting, fallback, and simulation math.",
          "CI runs lint, typecheck, tests, and a production build on every push.",
        ],
      },
      {
        heading: "The contact endpoint",
        paragraphs: [
          "Input is validated strictly and rate-limited per IP with an in-memory bounded map. It is honest about its own limits — per instance, no infrastructure — and spam that repeats itself blunts itself before it ever reaches the inbox.",
          "Messages land in Postgres with timestamps and are viewable at /admin behind a bearer token. A public /stats page aggregates pilots, docks, achievements, and messages — the same data the admin sees minus anything private.",
        ],
        code: {
          lang: "ts",
          snippet:
            "const bucket = buckets.get(ip) ?? { count: 0, resetAt: now + 60_000 };\nif (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + 60_000; }\nif (++bucket.count > 5) return new Response(\"Slow down\", { status: 429 });\nbuckets.set(ip, bucket);",
        },
      },
      {
        heading: "What I would change",
        paragraphs: [
          "The rate limiter should be shared rather than per instance. On a hobby plan with one region it is fine, but it is a lie waiting to happen the moment traffic spreads across functions, and the code says so in a comment.",
          "The admin token is a bearer secret with no rotation. Fine for a portfolio contact inbox, wrong for anything holding real user data.",
        ],
      },
    ],
  },
  {
    slug: "turbopack-migration-notes",
    title: "Moving a real app to Turbopack without breaking prod",
    date: "2026-09-28",
    excerpt:
      "Dev got faster immediately. Then I found the three assumptions that quietly depended on webpack, and the fix was not what I expected.",
    tags: ["Next.js", "Tooling", "Performance"],
    minutes: 6,
    cover: {
      src: "/blog/turbopack-migration-notes.svg",
      alt: "Dense bar histogram with a baseline rule, in violet on deep blue",
    },
    body: [
      "The pitch for Turbopack is dev-server speed, and the speed is real — a cold start that used to sit at eleven seconds now starts in under two. That part was easy.",
      "The interesting part was everything that had been quietly relying on webpack's behaviour. Not errors, which are fine. Assumptions.",
      "The app was not a toy. It had a 3D scene, a database-backed progress system, an admin inbox, and fifteen tests that had to keep passing. That combination is what made this a migration worth writing down, rather than a weekend experiment.",
    ],
    quote:
      "Nothing broke loudly. Three things behaved differently, and only one of them would have shown up in production.",
    sections: [
      {
        heading: "Assumption one: config resolution was total",
        paragraphs: [
          "webpack config had accumulated plugins and aliases tuned for an older project layout. Turbopack resolves config through a deliberately narrower surface, and anything outside that surface is ignored rather than reported.",
          "So a build would succeed with an alias silently missing, and the symptom was an unresolved import at runtime in one route. The fix was deleting the legacy aliases, not adding a compatibility shim.",
        ],
      },
      {
        heading: "Assumption two: module side effects",
        paragraphs: [
          "A couple of modules relied on being evaluated exactly once for their side effect. In dev that held; in a production build the evaluation order is different and the side effect ran twice, producing duplicate records in the database.",
          "The lesson is uncomfortable but general: side effects that are load-bearing are bugs with good timing. Anything that must run once should be idempotent, or explicitly initialised.",
        ],
        bullets: [
          "Legacy webpack aliases: deleted, not shimmed.",
          "Import-time side effects: moved into explicit initialisation.",
          "CSS ordering relied on file order — replaced with an explicit layer.",
          "Build output verified by diffing route manifests, not by trusting a green build.",
        ],
        code: {
          lang: "bash",
          snippet:
            "# compare what webpack built against what Turbopack builds\nnext build            # capture route manifest\nnext build --turbopack # diff the two manifests\n# any route that appears, disappears, or flips static/dynamic is a finding",
        },
      },
      {
        heading: "How I would sequence it",
        paragraphs: [
          "On a codebase this size: switch the dev server first and live with it for a week, then switch the build behind a flag so you can diff route manifests, then remove the flag once the manifests agree.",
          "The speed benefit arrives immediately and keeps you motivated. The risk arrives slowly and quietly, which is exactly the wrong shape for a big-bang migration.",
        ],
      },
    ],
  },
  {
    slug: "neon-connection-math",
    title: "The connection math behind a serverless Postgres app",
    date: "2026-09-19",
    excerpt:
      "Serverless scales instances faster than databases scale connections. Here is the arithmetic that broke, and the pooled fix.",
    tags: ["Postgres", "Serverless", "Databases"],
    minutes: 7,
    cover: {
      src: "/blog/neon-connection-math.svg",
      alt: "A node graph wired to a bright hub, in cyan on deep blue",
    },
    body: [
      "The error message was unhelpful: connection terminated unexpectedly. It happened under load, never locally, and only in production, which is the least useful combination of facts available to a human being.",
      "The cause was arithmetic. Serverless functions scale out horizontally and fast. A Postgres instance has a hard cap on concurrent connections. Multiply the two and you get a number that fails long before your traffic graph looks impressive.",
      "This is the failure mode I now design against on day one rather than discover under load: every serverless project I start gets a single pooled client in the first commit, because retrofitting pooling after the first incident means touching every query.",
    ],
    quote:
      "Pooling is not an optimisation. On serverless it is the difference between a database and an outage.",
    sections: [
      {
        heading: "The numbers that explain it",
        paragraphs: [
          "Free and small Postgres tiers cap out around twenty concurrent connections. A single serverless function instance holds a connection for as long as it is warm. Ten warm instances is ten connections used by requests that are mostly idle.",
          "Then a traffic spike opens thirty more instances, and each tries to open its own connection on first query. Now you are queued behind a cap that was never designed for a fan-out topology.",
        ],
        code: {
          lang: "text",
          snippet:
            "connections = instances × concurrent requests per instance\n20 connection cap ÷ 1 request each = 20 simultaneous queries, ever\n\nneon pooled endpoint: one logical connection, multiplexed over one real one",
        },
      },
      {
        heading: "The fix in one file",
        paragraphs: [
          "Everything goes through a single pooled client created at module scope, so all functions in one warm instance share it. The pooled endpoint from Neon multiplexes that logical connection onto a single real socket, which means the function count stops being a connection count.",
          "Schema creation is memoized per process so cold starts do not run DDL repeatedly. Combined, a fresh environment is one request away from a working database, which is exactly what you want when a demo environment expires on a Friday.",
        ],
        bullets: [
          "One module-scope pooled client, shared by all handlers in an instance.",
          "Pooled endpoint, not the direct one, for serverless functions.",
          "Memoize schema creation per process.",
          "Cap query duration so a bad query cannot hold a slot indefinitely.",
        ],
        code: {
          lang: "ts",
          snippet:
            "let clientPromise: Promise<Pool> | null = null;\n\nexport function db() {\n  clientPromise ??= new Pool({\n    connectionString: process.env.DATABASE_URL, // pooled endpoint\n    max: 1, // multiplexed, not per-request\n  });\n  return clientPromise;\n}",
        },
      },
      {
        heading: "The lesson underneath",
        paragraphs: [
          "Serverless moves the bottleneck. It does not remove it. Your database still has limits; you have simply changed the shape of the traffic that hits them, and the shape matters more than the volume.",
        ],
      },
    ],
  },
  {
    slug: "thirty-day-design-tokens",
    title: "Thirty days, one design system, zero hardcoded hex codes",
    date: "2026-09-05",
    excerpt:
      "The codebase had 214 colour literals. Getting to zero took a month, a staged rollout, and one uncomfortable refactor.",
    tags: ["Design Systems", "Refactoring", "CSS"],
    minutes: 8,
    cover: {
      src: "/blog/thirty-day-design-tokens.svg",
      alt: "A timeline spine with alternating milestone ticks, in pink on deep blue",
    },
    body: [
      "I counted 214 hardcoded hex codes in a codebase I had maintained for two years. Same design, my own work, and not one of them reachable from a single place.",
      "The fix was not a big-bang find-and-replace. That approach breaks a design system in about nine minutes. The fix was staged, boring, and took thirty days.",
      "The incentive that made it stick was not virtue. It was that the site gained a light theme and per-section accent colours in the same quarter — and for the first time, that work took an afternoon instead of a month.",
    ],
    quote:
      "A token migration is a translation project, not a search-and-replace. Translate intent, then let the linter find the stragglers.",
    sections: [
      {
        heading: "Phase one: name the existing reality",
        paragraphs: [
          "The temptation is to design the perfect token scale first. Instead I catalogued what the CSS already did — the greys that were almost the same, the two blues used for links and accents, the translucent white used as a background in four unrelated places.",
          "Naming them honestly surfaced that half the inconsistency was accidental. Those were quick wins with no visual change at all, which made the month feel worth it.",
        ],
        bullets: [
          "Semantic names only: --surface, --line, --text-muted, --accent. Never --blue-500.",
          "Every token gets a dark and a light value from the start, even if they match.",
          "One accent variable per section; the planet colour drives it via --planet.",
        ],
      },
      {
        heading: "Phase two: migrate without changing pixels",
        paragraphs: [
          "The rule that kept it safe: every commit must be visually identical. Replace a literal with the token that resolves to the exact same value, ship it, move on. No grouping by component, no opportunistic colour changes.",
          "The reward is that the diff is trivially reviewable. Anyone can tell a pure refactor from a redesign at a glance, and trust survives the whole month.",
        ],
        code: {
          lang: "css",
          snippet:
            ":root {\n  --surface: rgb(9 14 20 / 100%);\n  --glass: 255 255 255;\n  --line: color-mix(in srgb, var(--planet) 22%, transparent);\n  --planet: #4fb8ff;\n}\n\n:root[data-theme=\"light\"] {\n  --surface: #f6f8fb;\n  --line: color-mix(in srgb, var(--planet) 28%, transparent);\n}",
        },
      },
      {
        heading: "Phase three: let the linter do the policing",
        paragraphs: [
          "A lint rule bans hex literals in component files. That rule is the entire reason the migration stuck — without it the count crept back up over the following quarter, one reasonable exception at a time.",
          "Then the payoff that never happens without a system: the accent colour is now one variable, so the whole site re-themes per section with a single assignment.",
        ],
        code: {
          lang: "js",
          snippet:
            "// no-hex-literals: components reference tokens, full stop\nexport default {\n  rules: {\n    \"no-hex-literals\": [\"error\", { path: \"src/**/*.tsx\" }],\n  },\n};",
        },
      },
    ],
  },
  {
    slug: "rate-limiting-without-a-cache",
    title: "Rate limiting a contact form with no cache and no budget",
    date: "2026-08-26",
    excerpt:
      "Five requests a minute, per IP, in a Map. It is not a real rate limiter. It is also, honestly, enough — and here is how to tell the difference.",
    tags: ["Security", "Backend", "Serverless"],
    minutes: 6,
    cover: {
      src: "/blog/rate-limiting-without-a-cache.svg",
      alt: "A terminal window showing a successful deployment checklist, in green on deep blue",
    },
    body: [
      "The contact form had no rate limit, which meant it had a spam problem, which meant people were filling my inbox with text about crypto. Something had to give.",
      "The cheapest honest fix is an in-memory map keyed by IP with a one-minute window, bounded in size so it cannot grow without limit. That is not a distributed rate limiter and I will not pretend otherwise.",
      "The endpoint had been live for two months with no limit at all, which is a fair illustration of how long a small personal project can run on a vulnerability that only matters once somebody notices it.",
    ],
    quote:
      "Know what your limiter does not protect against, and write it in a comment where the next person will read it.",
    sections: [
      {
        heading: "What this actually protects",
        paragraphs: [
          "It stops the naive case: one IP, many requests, generated by a script that does not bother to vary its source. That covers the overwhelming majority of contact-form spam.",
          "It does not stop a botnet. It does not survive a cold start, since a new instance starts with an empty map. It does not coordinate across regions. All three are real limitations and none of them matter for a portfolio contact form with a human reading every message.",
        ],
        code: {
          lang: "ts",
          snippet:
            "const WINDOW_MS = 60_000;\nconst LIMIT = 5;\nconst MAX_KEYS = 10_000; // bounded, or a spoofed-IP flood becomes a memory leak\n\nfunction hit(ip: string) {\n  const now = Date.now();\n  const entry = buckets.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };\n  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + WINDOW_MS; }\n  entry.count += 1;\n  if (buckets.size > MAX_KEYS) buckets.delete(buckets.keys().next().value);\n  buckets.set(ip, entry);\n  return entry.count <= LIMIT;\n}",
        },
      },
      {
        heading: "Validation is the other half",
        paragraphs: [
          "Rate limiting raises the cost of spam. Strict validation makes spam pointless — there is no point submitting garbage that fails a length check, a type check, and a honeypot.",
          "Together they are enough: a bounded map, a length-bounded payload, a honeypot field that humans never see, and strict validation that rejects rather than sanitises.",
        ],
        bullets: [
          "Bounded map with a hard key cap — no unbounded growth.",
          "Payload length checked before parsing anything.",
          "Honeypot field plus strict validation, both server-side.",
          "429 with a plain message, no internal detail leaked.",
          "A comment stating the per-instance limitation, permanently.",
        ],
      },
      {
        heading: "When to upgrade",
        paragraphs: [
          "The moment this endpoint touches money, accounts, or anything a user would miss if it vanished, the in-memory map is no longer a shortcut, it is a vulnerability. Redis or a hosted limiter is then the correct answer and this pattern should be deleted.",
        ],
      },
    ],
  },
  {
    slug: "accessible-motion-by-default",
    title: "Motion that respects the person who asked it not to move",
    date: "2026-08-14",
    excerpt:
      "prefers-reduced-motion is one media query. Respecting it properly meant rethinking every animation on the site, including the ones I liked most.",
    tags: ["Accessibility", "Motion", "CSS"],
    minutes: 5,
    cover: {
      src: "/blog/accessible-motion-by-default.svg",
      alt: "A large planet rising over a horizon grid with tilted orbit rings, in yellow on deep blue",
    },
    body: [
      "I have a 3D scene with a flying camera, five orbiting planets, and a HUD that moves continuously. It is the reason the site exists, and it is also the single worst thing I could show someone who gets motion sick from parallax.",
      "The polite version of this feature is honouring prefers-reduced-motion. The honest version is realizing how much of your design only works while moving.",
      "So I went through every animated thing on the site and asked what it was communicating. Most of it was communicating nothing, which made the decision easy and slightly embarrassing.",
    ],
    quote:
      "Reduced motion is not a theme. It is the same content with a different rendering strategy — exactly like my WebGL fallback.",
    sections: [
      {
        heading: "What the query actually asks",
        paragraphs: [
          "prefers-reduced-motion: reduce tells you the operating system has an accessibility setting enabled for motion sensitivity. It is set by people, not by preference for minimalism, and it often accompanies other needs.",
          "The correct response is not to remove all animation. It is to remove motion that is large, fast, or involuntary. A colour transition or a fade is usually fine. Parallax, auto-playing movement, and spinning anything are not.",
        ],
        bullets: [
          "Auto-playing continuous movement: stop it entirely.",
          "Parallax and scroll-linked transforms: replace with a static composition.",
          "Short opacity or colour transitions: keep.",
          "The 3D flight deck: disable by default and require an explicit opt-in.",
        ],
      },
      {
        heading: "The flight deck is the hard case",
        paragraphs: [
          "My fallback for a bad GPU was a flat explorer. Reduced motion needed the same answer: if the visitor prefers reduced motion, the 3D mode is off on load and the site opens as the document.",
          "The scene stays one click away behind an explicit control, which is the right shape anyway — nobody should be dropped into a camera that is already moving.",
        ],
        code: {
          lang: "ts",
          snippet:
            "const prefersReducedMotion = window.matchMedia(\"(prefers-reduced-motion: reduce)\");\n\nfunction pickMode(): \"webgl\" | \"flat\" {\n  if (prefersReducedMotion.matches) return \"flat\"; // opt in, never opt out\n  return probeWebGL() ? \"webgl\" : \"flat\";\n}",
        },
      },
      {
        heading: "Making it the default everywhere",
        paragraphs: [
          "The global CSS carries one reduced block that clamps transition durations and neutralises scroll-linked animation. Then the JavaScript side has to cooperate, because CSS cannot stop a Three.js render loop.",
          "Two layers, one intent: CSS for everything declarative, JavaScript for everything imperative. Half-measures here are how you end up with an accessible-looking site that still flies the camera.",
        ],
      },
    ],
  },
  {
    slug: "offline-first-pharmacy-stock",
    title: "Offline-first stock for a pharmacy counter with no signal",
    date: "2026-07-31",
    excerpt:
      "The most valuable feature in a stock app is the one that works when the network does not. Designing for the dead zone changed the whole data model.",
    tags: ["Offline-First", "Architecture", "Sync"],
    minutes: 7,
    cover: {
      src: "/blog/offline-first-pharmacy-stock.svg",
      alt: "Four satellites orbiting a glowing core, in teal on deep blue",
    },
    body: [
      "A pharmacy in a small town loses signal in ways that would be funny if it were not someone's stock ledger. Half the transactions I saw were recorded on paper because the app was unusable.",
      "So the requirement inverted. The network is the nice case. The app has to be complete and trustworthy with no network at all, and sync when it returns.",
      "That inversion is what makes the app pleasant for everyone, not just the shop with no signal. Writes stop feeling slow because they never wait, and the sync badge is a reassurance rather than an error.",
    ],
    quote:
      "If the queue is the source of truth and the server is a replica, offline stops being an error state and becomes a normal one.",
    sections: [
      {
        heading: "The data model that made it work",
        paragraphs: [
          "The local store is authoritative for writes. Every sale, every stock adjustment, every new item lands in a local log first, with a client-generated ID and a timestamp. The server accepts the log later and reconciles.",
          "That means the UI never waits on a network round trip, and the optimistic state it shows is the state that will be true. Nothing needs to reconcile visually because nothing was ever guessed.",
        ],
        bullets: [
          "Client-generated IDs make writes naturally idempotent on retry.",
          "A local log is the source of truth; the server is a replica that catches up.",
          "Conflicts resolve last-write-wins per field, logged for human review.",
          "Deletes are tombstones, so an offline delete cannot resurrect on sync.",
        ],
        code: {
          lang: "ts",
          snippet:
            "// Retrying the same op is free: the client ID makes it idempotent.\nasync function sync() {\n  const pending = await log.pending();\n  for (const op of pending) {\n    const res = await api.push(op); // keyed by op.id — safe to repeat\n    if (res.ok) await log.markDone(op.id);\n    else if (res.status === 409) await log.markConflict(op.id, res.server);\n  }\n}",
        },
      },
      {
        heading: "What the counter staff needed",
        paragraphs: [
          "Not a sync indicator. A plain-language answer to one question: is what I am seeing the truth right now? A single badge — synced, or 12 changes waiting — answered it better than any progress bar.",
          "The second thing staff asked for was the ability to add an item that the system has never seen. SKU-less quick entry, name and quantity only, flagged for review at sync. It is imperfect data, captured anyway, which beats perfect data that never gets typed.",
        ],
      },
      {
        heading: "Where I would go next",
        paragraphs: [
          "Conflict review is currently a log file. It should be a screen a pharmacist can glance at once a week: these twelve items changed on two devices, here is what we chose, tap to change it.",
          "The hard part of offline-first is never the storage. It is designing an interface that tells the truth about uncertainty without making the user think about uncertainty.",
        ],
      },
    ],
  },
  {
    slug: "webgl-fallback-strategy",
    title: "A fallback strategy for a site that is mostly WebGL",
    date: "2026-07-18",
    excerpt:
      "When the GPU is gone, the interesting question is not how to disable the 3D. It is how to keep every word of content without it.",
    tags: ["WebGL", "Resilience", "React"],
    minutes: 6,
    cover: {
      src: "/blog/webgl-fallback-strategy.svg",
      alt: "A hub node wired to a dozen satellite nodes, in blue on deep blue",
    },
    body: [
      "A percentage of visitors will never see your 3D scene: old laptops, remote desktops, locked-down corporate machines, screen readers, people who disabled hardware acceleration on purpose after a bad experience.",
      "The wrong fallback is a message saying WebGL is required. The right fallback is the same site, minus the flourish.",
      "The good news is that most of this site is not WebGL at all. Every section exists as an ordinary route, so the work was making sure nothing important had quietly moved inside the scene.",
    ],
    quote:
      "The test is simple: does the fallback lose content? If it loses words, it is not a fallback, it is an apology.",
    sections: [
      {
        heading: "Separate the renderer from the state",
        paragraphs: [
          "The architectural decision that makes fallback cheap is having one state model with two renderers. The scene reads a sim object and draws. The flat explorer reads the same sim object and lists.",
          "Because the content lives in data rather than in the 3D scene, the fallback is genuinely equivalent. Every section that exists as a planet also exists as a page.",
        ],
        bullets: [
          "One state model, two renderers.",
          "Content lives in data and routes, never only inside the scene.",
          "Probe before render, switch before mount, no flash of empty canvas.",
          "Reduced motion and no-WebGL both resolve to the same flat mode.",
        ],
        code: {
          lang: "tsx",
          snippet:
            "const [mode, setMode] = useState<Mode>(null);\n\nuseEffect(() => {\n  setMode(pickMode()); // probe runs after mount, before the scene mounts\n}, []);\n\nif (mode === null) return <FlatExplorer />; // no empty canvas flash\nreturn mode === \"webgl\" ? <FlightDeck /> : <FlatExplorer />;",
        },
      },
      {
        heading: "Probing without side effects",
        paragraphs: [
          "The probe creates a throwaway canvas and asks for a context. If it comes back null, or throws, you are in flat mode. It is four lines and it costs nothing — which is the point, because it runs before anything expensive has been allocated.",
          "One subtlety worth knowing: a context can be created and still fail later, on driver-level problems that only show up during a draw call. So the scene also needs a runtime guard that demotes to flat on a thrown context loss.",
        ],
        code: {
          lang: "ts",
          snippet:
            "canvas.addEventListener(\"webglcontextlost\", (e) => {\n  e.preventDefault();\n  setMode(\"flat\"); // recover as a reader, not a broken canvas\n});",
        },
      },
      {
        heading: "Testing the fallback properly",
        paragraphs: [
          "Force the fallback in CI and click through every page. Then read the HTML of the flat version and check that the headings and body text are genuinely there — not behind a client-side branch that only hydrates in a real browser.",
          "That last check caught a real bug: two sections existed only inside the scene, so the flat version was shorter than it should have been. Content that lives only in WebGL is content that does not exist.",
        ],
      },
    ],
  },
  {
    slug: "shipping-over-polishing",
    title: "Shipping over polishing, with an actual threshold",
    date: "2026-06-30",
    excerpt:
      "I rewrote the same feature four times because it was never ready. Then I wrote down what ready means and stopped.",
    tags: ["Process", "Career", "Lessons"],
    minutes: 5,
    cover: {
      src: "/blog/shipping-over-polishing.svg",
      alt: "A tall bar histogram with a low baseline, in orange on deep blue",
    },
    body: [
      "The fourth version of the flight mode was the one I shipped, and it was better than the first three mostly because I was finally tired of them. Exhaustion is a terrible quality process but a reliable deadline.",
      "So I replaced taste with a checklist. Not a quality bar — a stopping condition.",
      "The pattern repeated across three projects, which is enough for me to treat it as a personal default rather than a bad week.",
    ],
    quote:
      "Perfectionism is usually just fear wearing a very convincing outfit.",
    sections: [
      {
        heading: "The definition of done I now use",
        paragraphs: [
          "Four questions, and if all four are yes it goes out regardless of how it feels. Does the primary path work end to end? Is the failure path handled? Can someone who did not build it use it? Have I written the post-mortem note for myself?",
          "Nothing there mentions polish. That is deliberate. Polish is unbounded, which means it can always absorb the remaining time, which means something else never gets done.",
        ],
        bullets: [
          "Primary path works end to end, tested by someone who did not build it.",
          "The obvious failure paths are handled, not just the happy one.",
          "Documentation exists — a README and one honest commit message.",
          "The next improvement is written down where it will be found later.",
        ],
      },
      {
        heading: "Where polish actually belongs",
        paragraphs: [
          "After launch, on the thing that people actually touch. I had it backwards for years: polishing the demo, then shipping whatever the demo promised.",
          "The contact form had ugly error states for six months and nobody complained, because nobody hit them. The landing page had a hand-tuned transition that made people mention it. Attention is a very precise signal about where effort belongs.",
        ],
      },
      {
        heading: "The reframe",
        paragraphs: [
          "Shipping is not the opposite of craft. It is the condition under which craft compounds. Work that is never released does not get better, it just gets more elaborate — and elaboration is indistinguishable from improvement if you never let anyone use it.",
        ],
      },
    ],
  },
  {
    slug: "sql-index-cheat-sheet",
    title: "The index cheat sheet I actually keep open",
    date: "2026-06-08",
    excerpt:
      "Six index patterns that cover most of what I have needed, plus the one query planner mistake that costs hours every time.",
    tags: ["Postgres", "Performance", "SQL"],
    minutes: 6,
    cover: {
      src: "/blog/sql-index-cheat-sheet.svg",
      alt: "A radar sweep with concentric dashed rings and a data bar row, in green on deep blue",
    },
    body: [
      "Indexing advice is usually either absent or a list of forty rules. In practice six patterns have covered nearly every slow query I have written.",
      "This is the list, with the planner gotcha that has cost me more hours than all of them combined.",
      "None of these are clever. Every one of them is a pattern I have shipped more than once, which is a better track record than any clever trick I have learned and abandoned.",
    ],
    quote:
      "If the plan does not say what you expected, the index is not your problem yet. Read the plan first, always.",
    sections: [
      {
        heading: "The patterns",
        paragraphs: [
          "Equality columns first, then the range column, then the sort column. Postgres can only use one b-tree for range lookups, so column order is not a style preference — it decides whether the index gets used at all.",
          "Partial indexes for the hot subset. If ninety percent of your queries touch the last seven days of a large events table, index those seven days and nothing else. Smaller index, hotter cache, better hit rate.",
        ],
        bullets: [
          "Equality columns first, then range, then sort. Order decides usability.",
          "Partial index for the hot subset: WHERE created_at > now() - interval '7 days'.",
          "Covering index (INCLUDE) so the planner can answer from the index alone.",
          "Composite index on (tenant_id, created_at) for every multi-tenant table.",
          "Expression index for lower(email) or date(created_at), matching the query exactly.",
          "GIN index for JSONB containment and full-text search. Reach for it last, it is expensive to write.",
        ],
        code: {
          lang: "sql",
          snippet:
            "-- covering index: filtered, ordered, and answers the query from the index\nCREATE INDEX CONCURRENTLY idx_events_tenant_recent\n  ON events (tenant_id, created_at DESC)\n  INCLUDE (id, kind)\n  WHERE created_at > now() - interval '7 days';",
        },
      },
      {
        heading: "The gotcha: seq scan on a small table",
        paragraphs: [
          "The planner will happily ignore your index and sequential scan a table with forty thousand rows, because a sequential scan is genuinely cheaper. The planner is not being stupid; it is being correct about a table smaller than your working set.",
          "The hour I lose every time: I add an index, refresh the plan, and it still says Seq Scan. The cause is almost always statistics that are stale after a bulk import.",
        ],
        code: {
          lang: "sql",
          snippet:
            "EXPLAIN (ANALYZE, BUFFERS) SELECT ...;   -- actual rows, actual time\nANALYZE events;                             -- usually this is the fix\n-- FORCE only to prove the index is usable; never ship FORCE",
        },
      },
      {
        heading: "Indexes are not free",
        paragraphs: [
          "Every index is a second copy of your data that must stay consistent on every write. On a write-heavy table, an index that helps one admin report can halve your insert throughput.",
          "So I check for unused indexes periodically and drop the ones nothing has read since the stats reset. It is the least glamorous database work and the highest ratio of saved time to effort I know.",
        ],
      },
    ],
  },
  {
    slug: "from-wordpress-to-nextjs",
    title: "What I got wrong migrating WordPress to Next.js",
    date: "2026-05-22",
    excerpt:
      "I rebuilt a decade of content into a modern stack and broke things that were working. Four mistakes, all recoverable, none obvious.",
    tags: ["WordPress", "Next.js", "Migration"],
    minutes: 7,
    cover: {
      src: "/blog/from-wordpress-to-nextjs.svg",
      alt: "Concentric range arcs sweeping up from the lower left, in purple on deep blue",
    },
    body: [
      "I moved a WordPress site with ten years of content to Next.js and a Postgres database. The stack is objectively better. The first month was worse in several specific ways I could have predicted.",
      "The site had nine thousand posts, a custom theme nobody fully understood, two plugins doing jobs badly, and an editor who had been publishing without opening a terminal for six years. That last detail turned out to matter more than the rest of the stack combined.",
      "These are the mistakes I would flag to anyone doing the same migration, written from the perspective of somebody who did all four.",
    ],
    quote:
      "You are not migrating a website. You are migrating every URL somebody ever bookmarked, emailed, or printed.",
    sections: [
      {
        heading: "Mistake one: no redirect map, drafted late",
        paragraphs: [
          "The content moved fine. The links did not. Ten years of accumulated URLs — blog posts, old campaign pages, a PDF that got quoted in a newsletter — turned into 404s the moment I changed the permalink structure.",
          "I wrote the redirect map as a final step, by exporting the old sitemap and hoping for the best. Build it first: one row per old path to new path, tested in CI, and a catch-all report so nothing 404s silently.",
        ],
        bullets: [
          "Export the full old sitemap before touching anything.",
          "One redirect row per old path; keep it in version control.",
          "Fail CI on any redirect pointing at a 404.",
          "Keep old paths alive indefinitely — links outlive the reasons they existed.",
        ],
      },
      {
        heading: "Mistake two: treating the editor as a dev",
        paragraphs: [
          "The editor had been publishing posts for six years without touching a terminal. After the migration, publishing meant a git commit and a deploy, and the content stopped. Not because people disliked the new system — because the friction went from zero to high.",
          "The honest options are a headless CMS pointed at the same API, or an authenticated edit surface that writes to Postgres. Both are real projects. Pretending the git workflow is fine is how you end up with a portfolio whose blog stopped eight months ago.",
        ],
      },
      {
        heading: "Mistake three: rebuilding plugins as custom code",
        paragraphs: [
          "Two plugins existed to do small things badly: a contact form and a cookie banner. I rewrote both from scratch, which took a fortnight and produced something less reliable than what it replaced.",
          "The licence I now start from: if a maintained open-source plugin already does the job, wrap it, do not reimplement it. Custom code is a liability you have to maintain forever.",
        ],
        code: {
          lang: "ts",
          snippet:
            "// The 301 map is data, not code — reviewable, testable, diffable.\nexport const redirects: Record<string, string> = {\n  \"/2021/03/my-old-post\": \"/blog/my-old-post\",\n  \"/downloads/old-pdf\": \"/resume\",\n};",
        },
      },
      {
        heading: "Mistake four: skipping the visual diff",
        paragraphs: [
          "I checked that pages loaded and links worked. I did not check whether the typography, spacing, and image crops still looked right at desktop and mobile widths.",
          "A visual regression pass across the whole site found about fifteen subtle layout shifts that all of my tests passed straight through. Nobody looking at the migrated site had mentioned it, because most visitors never scroll to page nine.",
        ],
      },
      {
        heading: "Would I migrate again",
        paragraphs: [
          "Yes, and I would keep WordPress running until the new stack had served real traffic for a month. Every one of these four mistakes would have been caught by a redirect map, an editor, a plugin decision, and a visual diff — all of which are cheap when you plan for them and expensive when you discover them.",
        ],
      },
    ],
  },
];