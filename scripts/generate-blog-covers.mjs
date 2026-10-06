/**
 * Generates the cover art for every blog post.
 *
 * The covers are procedural SVGs rather than stock photography: one palette,
 * one composition language, seeded per slug so re-running the script is stable.
 * Output lands in public/blog/<slug>.svg.
 *
 * Run: node scripts/generate-blog-covers.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

const W = 1200;
const H = 630;

/** Mulberry32 — small, fast, deterministic PRNG. */
function seeded(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i += 1) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n) => Math.round(n * 100) / 100;

/** Starfield with a soft glow on the brighter stars. */
function starfield(rand, count, opacity = 1) {
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const x = round(rand() * W);
    const y = round(rand() * H);
    const r = round(0.5 + rand() * 1.6);
    const o = round(0.15 + rand() * 0.6);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#dce9f5" opacity="${round(o * opacity)}" />`;
    if (r > 1.6) {
      out += `<circle cx="${x}" cy="${y}" r="${round(r * 3.4)}" fill="#dce9f5" opacity="${round(o * 0.08 * opacity)}" />`;
    }
  }
  return out;
}

/** Perspective grid across the lower third — reads as "instrumentation". */
function horizonGrid(color, opacity = 0.3) {
  const horizon = H * 0.66;
  let out = `<line x1="0" y1="${round(horizon)}" x2="${W}" y2="${round(horizon)}" stroke="${color}" stroke-width="1.5" opacity="${opacity + 0.25}" />`;
  for (let i = 1; i <= 9; i += 1) {
    const y = round(horizon + (H - horizon) * (i / 9) ** 2.1);
    out += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${color}" stroke-width="1" opacity="${round(opacity * (1 - i / 11))}" />`;
  }
  for (let i = -7; i <= 7; i += 1) {
    const spread = i * 120;
    const x = W / 2 + spread * 2.6;
    out += `<line x1="${round(W / 2 + spread * 0.28)}" y1="${round(horizon)}" x2="${round(x)}" y2="${H}" stroke="${color}" stroke-width="1" opacity="${round(opacity * 0.7)}" />`;
  }
  return out;
}

/** Orbit ellipse tilted around the planet. */
function orbit(cx, cy, rx, ry, tilt, color, opacity) {
  return `<g transform="rotate(${tilt} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="1.25" opacity="${opacity}" stroke-dasharray="6 9" /></g>`;
}

/** Bar-chart glyph, height varies with the post index so covers differ. */
function dataBars(rand, x, y, width, height, color, opacity = 0.55) {
  let out = "";
  const count = 7;
  const gap = width / count;
  for (let i = 0; i < count; i += 1) {
    const h = round(height * (0.24 + rand() * 0.76));
    out += `<rect x="${round(x + i * gap)}" y="${round(y + height - h)}" width="${round(gap * 0.52)}" height="${h}" rx="2" fill="${color}" opacity="${round(opacity * (0.45 + rand() * 0.55))}" />`;
  }
  return out;
}

/** Concentric "radar" arcs — used as the focal object on some covers. */
function radarArcs(cx, cy, max, color, rand) {
  let out = "";
  const rings = 5;
  for (let i = 1; i <= rings; i += 1) {
    const r = round(max * (i / rings));
    const dash = i % 2 === 0 ? "2 7" : "";
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="1.2" opacity="${round(0.42 - i * 0.05)}" ${dash ? `stroke-dasharray="${dash}"` : ""} />`;
  }
  const sweep = rand() * 360;
  out += `<path d="M ${cx} ${cy} L ${cx + max} ${cy} A ${max} ${max} 0 0 0 ${cx} ${cy + max} Z" fill="${color}" opacity="0.07" transform="rotate(${round(sweep)} ${cx} ${cy})" />`;
  out += `<line x1="${cx}" y1="${cy}" x2="${cx + max}" y2="${cy}" stroke="${color}" stroke-width="1.5" opacity="0.5" transform="rotate(${round(sweep)} ${cx} ${cy})" />`;
  return out;
}

/** Small monospace caption block in the lower left. */
function caption(label, sub, color) {
  return `<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace">
    <text x="72" y="${H - 92}" fill="${color}" font-size="19" letter-spacing="6" opacity="0.95">${label}</text>
    <text x="72" y="${H - 62}" fill="#9fb4c6" font-size="15" letter-spacing="3.4" opacity="0.72">${sub}</text>
    <line x1="72" y1="${H - 122}" x2="${W - 72}" y2="${H - 122}" stroke="${color}" stroke-width="1" opacity="0.22" />
  </g>`;
}

/**
 * Each variant picks a different focal composition so ten covers do not read
 * as ten copies of the same card.
 */
const VARIANTS = [
  // 0 — planet rising over the grid, rings to the right
  (rand, a) => `
    ${horizonGrid(a, 0.26)}
    <circle cx="${W * 0.72}" cy="${H * 0.52}" r="188" fill="url(#planet)" />
    <circle cx="${W * 0.72}" cy="${H * 0.52}" r="188" fill="none" stroke="${a}" stroke-width="2" opacity="0.5" />
    ${orbit(W * 0.72, H * 0.52, 268, 62, -18, a, 0.5)}
    ${orbit(W * 0.72, H * 0.52, 320, 88, -18, a, 0.24)}
    <ellipse cx="${W * 0.72}" cy="${H * 0.52}" rx="330" ry="96" fill="none" stroke="${a}" stroke-width="16" opacity="0.06" transform="rotate(-18 ${W * 0.72} ${H * 0.52})" />`,
  // 1 — radar sweep as the hero object
  (rand, a) => `
    ${radarArcs(W * 0.68, H * 0.48, 210, a, rand)}
    ${dataBars(rand, 72, H - 260, 300, 130, a, 0.5)}`,
  // 2 — stacked signal waves
  (rand, a) => {
    let out = "";
    for (let i = 0; i < 5; i += 1) {
      const amp = 26 + i * 20;
      const y = H * 0.42 + i * 12;
      let d = `M 60 ${round(y)}`;
      for (let x = 60; x <= W - 60; x += 40) {
        const yy = round(y + Math.sin((x / 150) * Math.PI + i) * amp * 0.5);
        d += ` L ${x} ${yy}`;
      }
      out += `<path d="${d}" fill="none" stroke="${a}" stroke-width="${round(2.4 - i * 0.3)}" opacity="${round(0.62 - i * 0.1)}" />`;
    }
    return `${out}${horizonGrid(a, 0.16)}`;
  },
  // 3 — node graph: nodes wired to a hub
  (rand, a) => {
    const hubX = W * 0.68;
    const hubY = H * 0.47;
    let out = "";
    for (let i = 0; i < 11; i += 1) {
      const ang = (i / 11) * Math.PI * 2;
      const dist = 150 + rand() * 110;
      const x = round(hubX + Math.cos(ang) * dist);
      const y = round(hubY + Math.sin(ang) * dist * 0.72);
      out += `<line x1="${hubX}" y1="${hubY}" x2="${x}" y2="${y}" stroke="${a}" stroke-width="1" opacity="${round(0.2 + rand() * 0.3)}" />`;
      out += `<circle cx="${x}" cy="${y}" r="${round(3 + rand() * 4)}" fill="${a}" opacity="${round(0.5 + rand() * 0.4)}" />`;
    }
    out += `<circle cx="${hubX}" cy="${hubY}" r="46" fill="${a}" opacity="0.16" />`;
    out += `<circle cx="${hubX}" cy="${hubY}" r="20" fill="${a}" opacity="0.75" />`;
    return out;
  },
  // 4 — terminal window
  (rand, a) => {
    const x = 120;
    const y = 118;
    const w = W - 240;
    const h = 330;
    let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#071019" opacity="0.82" stroke="${a}" stroke-width="1.5" stroke-opacity="0.45" />`;
    out += `<rect x="${x}" y="${y}" width="${w}" height="42" rx="14" fill="${a}" opacity="0.14" />`;
    out += `<rect x="${x}" y="${y + 28}" width="${w}" height="14" fill="#071019" opacity="0.82" />`;
    ["#ff6b6b", "#ffc46b", "#6bd28a"].forEach((c, i) => {
      out += `<circle cx="${x + 26 + i * 20}" cy="${y + 21}" r="5.5" fill="${c}" opacity="0.9" />`;
    });
    const lines = [
      ["$ deploy --prod", a],
      ["✓ build compiled in 13.2s", "#6bd28a"],
      ["✓ 34 routes prerendered", "#6bd28a"],
      ["✓ database reachable", "#6bd28a"],
      ["→ live in 47s", "#9fb4c6"],
    ];
    lines.forEach(([text, color], i) => {
      out += `<text x="${x + 28}" y="${y + 92 + i * 34}" font-family="ui-monospace, Menlo, monospace" font-size="20" fill="${color}" opacity="0.9">${text}</text>`;
    });
    return out;
  },
  // 5 — concentric arcs from the left edge, like a range readout
  (rand, a) => {
    let out = "";
    for (let i = 0; i < 6; i += 1) {
      const r = 120 + i * 78;
      out += `<path d="M ${-40} ${H * 0.86} A ${r} ${r} 0 0 1 ${-40 + r * 1.2} ${H * 0.86 - r * 0.82}" fill="none" stroke="${a}" stroke-width="${round(2.6 - i * 0.3)}" opacity="${round(0.6 - i * 0.08)}" />`;
    }
    out += dataBars(rand, W - 430, H - 250, 350, 140, a, 0.5);
    return out;
  },
  // 6 — layered translucent panels
  (rand, a) => {
    let out = "";
    for (let i = 0; i < 4; i += 1) {
      const x = 620 + i * 34;
      const y = 90 + i * 26;
      out += `<rect x="${x}" y="${y}" width="440" height="330" rx="16" fill="${a}" opacity="${round(0.06 + i * 0.035)}" stroke="${a}" stroke-width="1.2" stroke-opacity="0.34" />`;
    }
    out += `<rect x="620" y="90" width="440" height="330" rx="16" fill="none" stroke="${a}" stroke-width="2" opacity="0.5" />`;
    out += dataBars(rand, 660, 300, 360, 96, a, 0.55);
    return out;
  },
  // 7 — stacked bar histogram, heavy left mass
  (rand, a) => {
    let out = "";
    for (let i = 0; i < 18; i += 1) {
      const h = round(40 + rand() * 300);
      out += `<rect x="${round(70 + i * 32)}" y="${round(H - 70 - h)}" width="20" height="${h}" rx="4" fill="${a}" opacity="${round(0.2 + rand() * 0.5)}" />`;
    }
    out += `<line x1="70" y1="${H - 70}" x2="${W - 70}" y2="${H - 70}" stroke="${a}" stroke-width="1.5" opacity="0.4" />`;
    return out;
  },
  // 8 — orbiting satellites around a small core
  (rand, a) => {
    const cx = W * 0.5;
    const cy = H * 0.46;
    let out = `<circle cx="${cx}" cy="${cy}" r="34" fill="${a}" opacity="0.28" />`;
    out += `<circle cx="${cx}" cy="${cy}" r="34" fill="none" stroke="${a}" stroke-width="2" opacity="0.6" />`;
    for (let i = 0; i < 4; i += 1) {
      const rx = 130 + i * 74;
      const tilt = -24 + i * 15;
      out += orbit(cx, cy, rx, rx * 0.42, tilt, a, 0.34);
      const ang = rand() * Math.PI * 2;
      const sx = round(cx + Math.cos(ang) * rx);
      const sy = round(cy + Math.sin(ang) * rx * 0.42);
      out += `<circle cx="${sx}" cy="${sy}" r="${round(6 + i * 1.6)}" fill="${a}" opacity="0.85" />`;
      out += `<circle cx="${sx}" cy="${sy}" r="${round(16 + i * 5)}" fill="${a}" opacity="0.1" />`;
    }
    return out;
  },
  // 9 — timeline spine with milestone ticks
  (rand, a) => {
    const y = H * 0.5;
    let out = `<line x1="90" y1="${y}" x2="${W - 90}" y2="${y}" stroke="${a}" stroke-width="2" opacity="0.4" />`;
    for (let i = 0; i < 8; i += 1) {
      const x = round(90 + i * ((W - 180) / 7));
      const big = i % 2 === 0;
      const h = big ? 74 : 40;
      out += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="${a}" stroke-width="2" opacity="${big ? 0.8 : 0.4}" />`;
      out += `<circle cx="${x}" cy="${y}" r="${big ? 9 : 6}" fill="${a}" opacity="${big ? 0.9 : 0.5}" />`;
      out += `<rect x="${x - 26}" y="${y + 22}" width="52" height="${round(6 + rand() * 16)}" rx="3" fill="${a}" opacity="0.2" />`;
    }
    return out;
  },
];

function renderCover(post) {
  const rand = seeded(post.slug);
  const accent = post.accent;
  const idx = post.variant ?? 0;
  const art = (VARIANTS[idx % VARIANTS.length] ?? VARIANTS[0])(rand, accent);
  const label = post.title ?? post.slug.replace(/-/g, " ");
  const planetCx = W * 0.78;
  const planetCy = H * 0.06;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeXml(label)}">
  <title>${escapeXml(label)}</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#0a1522" />
      <stop offset="0.55" stop-color="#0c1b2b" />
      <stop offset="1" stop-color="#050b13" />
    </linearGradient>
    <radialGradient id="planet" cx="0.34" cy="0.3" r="0.85">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.95" />
      <stop offset="0.55" stop-color="${accent}" stop-opacity="0.42" />
      <stop offset="1" stop-color="#04080e" stop-opacity="0.9" />
    </radialGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.34" />
      <stop offset="1" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050b13" stop-opacity="0" />
      <stop offset="1" stop-color="#050b13" stop-opacity="0.9" />
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)" />
  ${starfield(rand, 130)}
  <circle cx="${planetCx}" cy="${planetCy}" r="300" fill="url(#halo)" />
  ${art}
  <rect y="${H * 0.6}" width="${W}" height="${H * 0.4}" fill="url(#fade)" />
  ${caption(post.code, post.category, accent)}
</svg>
`;
}

function escapeXml(value) {
  return value.replace(/[<>&"']/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[ch]);
}

// Keep in sync with src/lib/posts.ts. Category and accent live in one place so
// the art and the metadata can never drift apart.
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
  writeFileSync(file, renderCover(cover), "utf8");
}

console.log(`Wrote ${COVERS.length} covers to public/blog`);