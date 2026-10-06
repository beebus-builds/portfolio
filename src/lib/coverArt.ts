/**
 * Procedural cover art for blog posts.
 *
 * One palette, one composition language, seeded per slug so the output is
 * stable: the same post always renders the same artwork. Shared by the batch
 * script (scripts/generate-blog-covers.mjs) and the admin editor, so a post
 * created in the browser gets the same visual language as the seeded ones.
 */

export type CoverSpec = {
  slug: string;
  title?: string;
  /** Short monospace label burned into the artwork, e.g. "BP-LOG 06". */
  code: string;
  /** Secondary label, e.g. "PERFORMANCE". */
  category: string;
  /** Accent colour; everything else is derived from it. */
  accent: string;
  /** Which composition to draw. Cycles through the variants. */
  variant?: number;
};

export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 630;

export const COVER_VARIANTS = [
  "planet over grid",
  "radar sweep",
  "signal waves",
  "node graph",
  "terminal",
  "range arcs",
  "layered panels",
  "histogram",
  "orbit satellites",
  "timeline",
] as const;

/** Accents chosen to sit comfortably on the deep-blue sky. */
export const COVER_ACCENTS = [
  "#7c5cff",
  "#34d399",
  "#f59e0b",
  "#38bdf8",
  "#fb7185",
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#4ade80",
  "#fbbf24",
  "#2dd4bf",
  "#60a5fa",
  "#fb923c",
  "#c084fc",
] as const;

/** Mulberry32 — small, fast, deterministic PRNG. */
function seeded(seedText: string): () => number {
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

const round = (n: number) => Math.round(n * 100) / 100;

function escapeXml(value: string): string {
  return value.replace(
    /[<>&"']/g,
    (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[ch] as string,
  );
}

/** Starfield with a soft glow on the brighter stars. */
function starfield(rand: () => number, count: number): string {
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const x = round(rand() * COVER_WIDTH);
    const y = round(rand() * COVER_HEIGHT);
    const r = round(0.5 + rand() * 1.6);
    const o = round(0.15 + rand() * 0.6);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#dce9f5" opacity="${o}" />`;
    if (r > 1.6) {
      out += `<circle cx="${x}" cy="${y}" r="${round(r * 3.4)}" fill="#dce9f5" opacity="${round(o * 0.08)}" />`;
    }
  }
  return out;
}

/** Perspective grid across the lower third — reads as "instrumentation". */
function horizonGrid(color: string, opacity = 0.3): string {
  const horizon = COVER_HEIGHT * 0.66;
  let out = `<line x1="0" y1="${round(horizon)}" x2="${COVER_WIDTH}" y2="${round(horizon)}" stroke="${color}" stroke-width="1.5" opacity="${round(opacity + 0.25)}" />`;
  for (let i = 1; i <= 9; i += 1) {
    const y = round(horizon + (COVER_HEIGHT - horizon) * (i / 9) ** 2.1);
    out += `<line x1="0" y1="${y}" x2="${COVER_WIDTH}" y2="${y}" stroke="${color}" stroke-width="1" opacity="${round(opacity * (1 - i / 11))}" />`;
  }
  for (let i = -7; i <= 7; i += 1) {
    const spread = i * 120;
    const x = COVER_WIDTH / 2 + spread * 2.6;
    out += `<line x1="${round(COVER_WIDTH / 2 + spread * 0.28)}" y1="${round(horizon)}" x2="${round(x)}" y2="${COVER_HEIGHT}" stroke="${color}" stroke-width="1" opacity="${round(opacity * 0.7)}" />`;
  }
  return out;
}

/** Orbit ellipse tilted around the planet. */
function orbit(cx: number, cy: number, rx: number, ry: number, tilt: number, color: string, opacity: number): string {
  return `<g transform="rotate(${tilt} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="1.25" opacity="${opacity}" stroke-dasharray="6 9" /></g>`;
}

/** Bar-chart glyph; heights vary with the seed so covers differ. */
function dataBars(rand: () => number, x: number, y: number, width: number, height: number, color: string, opacity = 0.55): string {
  let out = "";
  const count = 7;
  const gap = width / count;
  for (let i = 0; i < count; i += 1) {
    const h = round(height * (0.24 + rand() * 0.76));
    out += `<rect x="${round(x + i * gap)}" y="${round(y + height - h)}" width="${round(gap * 0.52)}" height="${h}" rx="2" fill="${color}" opacity="${round(opacity * (0.45 + rand() * 0.55))}" />`;
  }
  return out;
}

/** Concentric "radar" arcs. */
function radarArcs(cx: number, cy: number, max: number, color: string, rand: () => number): string {
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
function caption(label: string, sub: string, color: string): string {
  return `<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace">
    <text x="72" y="${COVER_HEIGHT - 92}" fill="${color}" font-size="19" letter-spacing="6" opacity="0.95">${escapeXml(label)}</text>
    <text x="72" y="${COVER_HEIGHT - 62}" fill="#9fb4c6" font-size="15" letter-spacing="3.4" opacity="0.72">${escapeXml(sub)}</text>
    <line x1="72" y1="${COVER_HEIGHT - 122}" x2="${COVER_WIDTH - 72}" y2="${COVER_HEIGHT - 122}" stroke="${color}" stroke-width="1" opacity="0.22" />
  </g>`;
}

type Variant = (rand: () => number, accent: string) => string;

const VARIANTS: Variant[] = [
  // 0 — planet rising over the grid, rings to the right
  (_rand, a) => `
    ${horizonGrid(a, 0.26)}
    <circle cx="${COVER_WIDTH * 0.72}" cy="${COVER_HEIGHT * 0.52}" r="188" fill="url(#planet)" />
    <circle cx="${COVER_WIDTH * 0.72}" cy="${COVER_HEIGHT * 0.52}" r="188" fill="none" stroke="${a}" stroke-width="2" opacity="0.5" />
    ${orbit(COVER_WIDTH * 0.72, COVER_HEIGHT * 0.52, 268, 62, -18, a, 0.5)}
    ${orbit(COVER_WIDTH * 0.72, COVER_HEIGHT * 0.52, 320, 88, -18, a, 0.24)}
    <ellipse cx="${COVER_WIDTH * 0.72}" cy="${COVER_HEIGHT * 0.52}" rx="330" ry="96" fill="none" stroke="${a}" stroke-width="16" opacity="0.06" transform="rotate(-18 ${COVER_WIDTH * 0.72} ${COVER_HEIGHT * 0.52})" />`,
  // 1 — radar sweep as the hero object
  (rand, a) => `
    ${radarArcs(COVER_WIDTH * 0.68, COVER_HEIGHT * 0.48, 210, a, rand)}
    ${dataBars(rand, 72, COVER_HEIGHT - 260, 300, 130, a, 0.5)}`,
  // 2 — stacked signal waves
  (rand, a) => {
    let out = "";
    for (let i = 0; i < 5; i += 1) {
      const amp = 26 + i * 20;
      const y = COVER_HEIGHT * 0.42 + i * 12;
      let d = `M 60 ${round(y)}`;
      for (let x = 60; x <= COVER_WIDTH - 60; x += 40) {
        const yy = round(y + Math.sin((x / 150) * Math.PI + i) * amp * 0.5);
        d += ` L ${x} ${yy}`;
      }
      out += `<path d="${d}" fill="none" stroke="${a}" stroke-width="${round(2.4 - i * 0.3)}" opacity="${round(0.62 - i * 0.1)}" />`;
    }
    return `${out}${horizonGrid(a, 0.16)}`;
  },
  // 3 — node graph: nodes wired to a hub
  (rand, a) => {
    const hubX = COVER_WIDTH * 0.68;
    const hubY = COVER_HEIGHT * 0.47;
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
  () => {
    const x = 120;
    const y = 118;
    const w = COVER_WIDTH - 240;
    const h = 330;
    let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#071019" opacity="0.82" stroke="#4ade80" stroke-width="1.5" stroke-opacity="0.45" />`;
    out += `<rect x="${x}" y="${y}" width="${w}" height="42" rx="14" fill="#4ade80" opacity="0.14" />`;
    out += `<rect x="${x}" y="${y + 28}" width="${w}" height="14" fill="#071019" opacity="0.82" />`;
    ["#ff6b6b", "#ffc46b", "#6bd28a"].forEach((c, i) => {
      out += `<circle cx="${x + 26 + i * 20}" cy="${y + 21}" r="5.5" fill="${c}" opacity="0.9" />`;
    });
    const lines: [string, string][] = [
      ["$ deploy --prod", "#4ade80"],
      ["build compiled in 13.2s", "#6bd28a"],
      ["34 routes prerendered", "#6bd28a"],
      ["database reachable", "#6bd28a"],
      ["live in 47s", "#9fb4c6"],
    ];
    lines.forEach(([text, color], i) => {
      out += `<text x="${x + 28}" y="${y + 92 + i * 34}" font-family="ui-monospace, Menlo, monospace" font-size="20" fill="${color}" opacity="0.9">${escapeXml(text)}</text>`;
    });
    return out;
  },
  // 5 — concentric arcs from the left edge, like a range readout
  (rand, a) => {
    let out = "";
    for (let i = 0; i < 6; i += 1) {
      const r = 120 + i * 78;
      out += `<path d="M -40 ${COVER_HEIGHT * 0.86} A ${r} ${r} 0 0 1 ${-40 + r * 1.2} ${COVER_HEIGHT * 0.86 - r * 0.82}" fill="none" stroke="${a}" stroke-width="${round(2.6 - i * 0.3)}" opacity="${round(0.6 - i * 0.08)}" />`;
    }
    return `${out}${dataBars(rand, COVER_WIDTH - 430, COVER_HEIGHT - 250, 350, 140, a, 0.5)}`;
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
    return `${out}${dataBars(rand, 660, 300, 360, 96, a, 0.55)}`;
  },
  // 7 — stacked bar histogram
  (rand, a) => {
    let out = "";
    for (let i = 0; i < 18; i += 1) {
      const h = round(40 + rand() * 300);
      out += `<rect x="${round(70 + i * 32)}" y="${round(COVER_HEIGHT - 70 - h)}" width="20" height="${h}" rx="4" fill="${a}" opacity="${round(0.2 + rand() * 0.5)}" />`;
    }
    out += `<line x1="70" y1="${COVER_HEIGHT - 70}" x2="${COVER_WIDTH - 70}" y2="${COVER_HEIGHT - 70}" stroke="${a}" stroke-width="1.5" opacity="0.4" />`;
    return out;
  },
  // 8 — orbiting satellites around a small core
  (rand, a) => {
    const cx = COVER_WIDTH * 0.5;
    const cy = COVER_HEIGHT * 0.46;
    let out = `<circle cx="${cx}" cy="${cy}" r="34" fill="${a}" opacity="0.28" />`;
    out += `<circle cx="${cx}" cy="${cy}" r="34" fill="none" stroke="${a}" stroke-width="2" opacity="0.6" />`;
    for (let i = 0; i < 4; i += 1) {
      const rx = 130 + i * 74;
      const tilt = -24 + i * 15;
      out += orbit(cx, cy, rx, round(rx * 0.42), tilt, a, 0.34);
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
    const y = COVER_HEIGHT * 0.5;
    let out = `<line x1="90" y1="${y}" x2="${COVER_WIDTH - 90}" y2="${y}" stroke="${a}" stroke-width="2" opacity="0.4" />`;
    for (let i = 0; i < 8; i += 1) {
      const x = round(90 + i * ((COVER_WIDTH - 180) / 7));
      const big = i % 2 === 0;
      const h = big ? 74 : 40;
      out += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="${a}" stroke-width="2" opacity="${big ? 0.8 : 0.4}" />`;
      out += `<circle cx="${x}" cy="${y}" r="${big ? 9 : 6}" fill="${a}" opacity="${big ? 0.9 : 0.5}" />`;
      out += `<rect x="${x - 26}" y="${y + 22}" width="52" height="${round(6 + rand() * 16)}" rx="3" fill="${a}" opacity="0.2" />`;
    }
    return out;
  },
];

/** Renders the complete cover SVG for a post. Deterministic per slug. */
export function renderCover(post: CoverSpec): string {
  const rand = seeded(post.slug);
  const accent = post.accent;
  const variantIndex = ((post.variant ?? 0) % VARIANTS.length + VARIANTS.length) % VARIANTS.length;
  const art = (VARIANTS[variantIndex] ?? VARIANTS[0])(rand, accent);
  const label = post.title ?? post.slug.replace(/-/g, " ");
  const planetCx = COVER_WIDTH * 0.78;
  const planetCy = COVER_HEIGHT * 0.06;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_WIDTH} ${COVER_HEIGHT}" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" role="img" aria-label="${escapeXml(label)}">
  <title>${escapeXml(label)}</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#0a1522" />
      <stop offset="0.55" stop-color="#0c1b2b" />
      <stop offset="1" stop-color="#050b13" />
    </linearGradient>
    <radialGradient id="planet" cx="0.34" cy="0.3" r="0.85">
      <stop offset="0" stop-color="${escapeXml(accent)}" stop-opacity="0.95" />
      <stop offset="0.55" stop-color="${escapeXml(accent)}" stop-opacity="0.42" />
      <stop offset="1" stop-color="#04080e" stop-opacity="0.9" />
    </radialGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${escapeXml(accent)}" stop-opacity="0.34" />
      <stop offset="1" stop-color="${escapeXml(accent)}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050b13" stop-opacity="0" />
      <stop offset="1" stop-color="#050b13" stop-opacity="0.9" />
    </linearGradient>
  </defs>

  <rect width="${COVER_WIDTH}" height="${COVER_HEIGHT}" fill="url(#sky)" />
  ${starfield(rand, 130)}
  <circle cx="${planetCx}" cy="${planetCy}" r="300" fill="url(#halo)" />
  ${art}
  <rect y="${COVER_HEIGHT * 0.6}" width="${COVER_WIDTH}" height="${COVER_HEIGHT * 0.4}" fill="url(#fade)" />
  ${caption(post.code, post.category, accent)}
</svg>
`;
}

/** Short label burned into the art, e.g. "BP-LOG 16". */
export function coverCode(index: number): string {
  return `BP-LOG ${String(index).padStart(2, "0")}`;
}

/** Picks an accent by index so a sequence of posts stays visually varied. */
export function coverAccent(index: number): string {
  return COVER_ACCENTS[index % COVER_ACCENTS.length];
}

/** Picks a composition by index. */
export function coverVariant(index: number): number {
  return index % COVER_VARIANTS.length;
}