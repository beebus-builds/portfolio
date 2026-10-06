/**
 * Writes the cover art for the seeded blog posts to public/blog/<slug>.svg.
 *
 * The generator itself lives in src/lib/coverArt.ts so the admin editor and
 * this batch script produce identical artwork. Posts created in the browser
 * render their cover inline instead, so they need no file on disk.
 *
 * Run: node scripts/generate-blog-covers.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { transformSync } = require("esbuild");
const { readFileSync } = require("node:fs");

/** Compiles the TypeScript module on the fly and returns its exports. */
function loadTs(path) {
  const { code } = transformSync(readFileSync(path, "utf8"), { loader: "ts", format: "cjs" });
  const mod = { exports: {} };
  new Function("module", "exports", "require", code)(mod, mod.exports, require);
  return mod.exports;
}

const coverArt = loadTs(resolve(dirname(fileURLToPath(import.meta.url)), "..", "src", "lib", "coverArt.ts"));

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

// Kept in sync with src/lib/posts.ts.
const COVERS = [
  { slug: "homomorphic-voting-notes", code: "BP-LOG 01", category: "CRYPTOGRAPHY", accent: "#7c5cff", variant: 5 },
  { slug: "gpx-on-a-phone", code: "BP-LOG 02", category: "PERFORMANCE", accent: "#34d399", variant: 6 },
  { slug: "wordpress-honest-audits", code: "BP-LOG 03", category: "MAINTENANCE", accent: "#f59e0b", variant: 1 },
  { slug: "three-oceans-portfolio", code: "BP-LOG 04", category: "WEBGL", accent: "#38bdf8", variant: 8 },
  { slug: "devverse-case-study", code: "BP-LOG 05", category: "CASE STUDY", accent: "#fb7185", variant: 2 },
  { slug: "turbopack-migration-notes", code: "BP-LOG 06", category: "NEXT.JS", accent: "#a78bfa", variant: 7 },
  { slug: "neon-connection-math", code: "BP-LOG 07", category: "DATABASES", accent: "#22d3ee", variant: 3 },
  { slug: "thirty-day-design-tokens", code: "BP-LOG 08", category: "DESIGN SYSTEMS", accent: "#f472b6", variant: 9 },
  { slug: "rate-limiting-without-a-cache", code: "BP-LOG 09", category: "SECURITY", accent: "#4ade80", variant: 4 },
  { slug: "accessible-motion-by-default", code: "BP-LOG 10", category: "ACCESSIBILITY", accent: "#fbbf24", variant: 0 },
  { slug: "offline-first-pharmacy-stock", code: "BP-LOG 11", category: "OFFLINE-FIRST", accent: "#2dd4bf", variant: 8 },
  { slug: "webgl-fallback-strategy", code: "BP-LOG 12", category: "RESILIENCE", accent: "#60a5fa", variant: 3 },
  { slug: "shipping-over-polishing", code: "BP-LOG 13", category: "PROCESS", accent: "#fb923c", variant: 7 },
  { slug: "sql-index-cheat-sheet", code: "BP-LOG 14", category: "POSTGRES", accent: "#34d399", variant: 1 },
  { slug: "from-wordpress-to-nextjs", code: "BP-LOG 15", category: "MIGRATION", accent: "#c084fc", variant: 5 },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const cover of COVERS) {
  const file = resolve(OUT_DIR, `${cover.slug}.svg`);
  writeFileSync(file, coverArt.renderCover(cover), "utf8");
}

console.log(`Wrote ${COVERS.length} covers to public/blog`);