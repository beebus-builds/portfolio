"use client";

function ArtFrame({ accent, tag, className = "", children }: { accent?: string; tag?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`art-surface ${className}`} style={accent ? ({ "--art-accent": accent } as React.CSSProperties) : undefined}>
      {children}
      <span className="art-scanline" aria-hidden="true" />
      {tag && <span className="art-tag" aria-hidden="true">{tag}</span>}
    </div>
  );
}

function Grid({ n = 6, opacity = 0.14 }: { n?: number; opacity?: number }) {
  const step = 100 / n;
  const lines = Array.from({ length: n + 1 }, (_, i) => i * step);
  return (
    <g opacity={opacity} stroke="#fff" strokeWidth="0.2">
      {lines.map((p) => <line key={`v${p}`} x1={p} y1={0} x2={p} y2={100} />)}
      {lines.map((p) => <line key={`h${p}`} x1={0} y1={p} x2={100} y2={p} />)}
    </g>
  );
}

export function HeroPortraitArt() {
  return (
    <ArtFrame className="hero-image-slot" tag="bibash.dev / self-portrait.tsx">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Grid n={8} opacity={0.1} />
        <circle cx="50" cy="42" r="30" fill="none" stroke="var(--art-accent)" strokeWidth="0.6" opacity="0.55" />
        <circle cx="50" cy="42" r="21" fill="none" stroke="var(--art-accent)" strokeWidth="0.4" opacity="0.35" />
        <circle cx="50" cy="42" r="12" fill="var(--art-accent)" opacity="0.14" />
        <text x="50" y="47" textAnchor="middle" fontSize="9" fontFamily="ui-monospace,monospace" fontWeight="700" fill="var(--art-accent)">BP</text>
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const r = 30 + (i % 3) * 3;
          return <circle key={i} cx={50 + Math.cos(a) * r} cy={42 + Math.sin(a) * r} r="0.6" fill="#fff" opacity={0.25 + (i % 4) * 0.1} />;
        })}
        <text x="50" y="88" textAnchor="middle" fontSize="4" fontFamily="ui-monospace,monospace" fill="#fff" opacity="0.3" letterSpacing="1">SINDHULI, NEPAL</text>
      </svg>
    </ArtFrame>
  );
}

export function SpotlightArt() {
  return (
    <ArtFrame className="spotlight-image" tag="case-study.render() → viewport">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Grid n={10} opacity={0.08} />
        <rect x="8" y="12" width="84" height="10" rx="2" fill="none" stroke="#fff" strokeOpacity="0.18" />
        <circle cx="13" cy="17" r="1.2" fill="#ff5f57" />
        <circle cx="18" cy="17" r="1.2" fill="#febc2e" />
        <circle cx="23" cy="17" r="1.2" fill="#28c840" />
        <rect x="8" y="28" width="36" height="58" rx="2" fill="var(--art-accent)" opacity="0.08" stroke="var(--art-accent)" strokeOpacity="0.4" strokeWidth="0.4" />
        <rect x="48" y="28" width="44" height="26" rx="2" fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="0.4" />
        <rect x="48" y="58" width="44" height="28" rx="2" fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="0.4" />
        {[36, 42, 48, 54, 60, 66, 72, 78].map((y) => <rect key={y} x="13" y={y} width={y % 12 === 0 ? 26 : 18} height="2" rx="1" fill="#fff" opacity="0.14" />)}
      </svg>
    </ArtFrame>
  );
}

export function DesignArt() {
  return (
    <ArtFrame className="design-image" tag="ui/tokens.figma → export">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Grid n={6} opacity={0.1} />
        <rect x="10" y="14" width="34" height="34" rx="4" fill="none" stroke="var(--art-accent)" strokeWidth="0.5" opacity="0.6" />
        <circle cx="27" cy="31" r="9" fill="var(--art-accent)" opacity="0.15" />
        <rect x="52" y="14" width="38" height="16" rx="3" fill="none" stroke="#fff" strokeOpacity="0.2" />
        <rect x="52" y="34" width="18" height="14" rx="3" fill="none" stroke="#fff" strokeOpacity="0.16" />
        <rect x="73" y="34" width="17" height="14" rx="3" fill="var(--art-accent)" opacity="0.12" />
        <rect x="10" y="58" width="80" height="1" fill="#fff" opacity="0.1" />
        {[64, 70, 76, 82].map((y, i) => <rect key={y} x="10" y={y} width={70 - i * 10} height="2.4" rx="1.2" fill="#fff" opacity={0.16 - i * 0.02} />)}
      </svg>
    </ArtFrame>
  );
}

export function CodeArchitectureArt() {
  const nodes = [[16, 20], [50, 12], [84, 22], [30, 50], [68, 48], [50, 80], [16, 78], [84, 76]];
  const edges = [[0, 3], [1, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7]];
  return (
    <ArtFrame className="code-image" tag="git log --graph --oneline">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Grid n={8} opacity={0.08} />
        <g stroke="var(--art-accent)" strokeWidth="0.4" opacity="0.45">
          {edges.map(([a, b], i) => <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />)}
        </g>
        {nodes.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="4.2" fill="#0c0e0d" stroke="var(--art-accent)" strokeWidth="0.5" opacity="0.8" />
            <circle cx={x} cy={y} r="1.4" fill="var(--art-accent)" opacity="0.6" />
          </g>
        ))}
      </svg>
    </ArtFrame>
  );
}

export function WordpressArt() {
  return (
    <ArtFrame className="wordpress-image" tag="wp-content/theme → build">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Grid n={8} opacity={0.08} />
        <rect x="8" y="10" width="84" height="66" rx="3" fill="none" stroke="#fff" strokeOpacity="0.18" />
        <line x1="8" y1="22" x2="92" y2="22" stroke="#fff" strokeOpacity="0.14" />
        {[16, 24, 32, 40].map((x) => <rect key={x} x={x} y="15" width="6" height="2.4" rx="1" fill="#fff" opacity="0.2" />)}
        <rect x="14" y="30" width="30" height="38" rx="2" fill="var(--art-accent)" opacity="0.1" stroke="var(--art-accent)" strokeOpacity="0.4" strokeWidth="0.4" />
        {[34, 40, 46, 52, 58].map((y) => <rect key={y} x="50" y={y} width={y % 12 === 4 ? 40 : 28} height="2.4" rx="1.2" fill="#fff" opacity="0.15" />)}
        <circle cx="82" cy="14" r="8" fill="var(--art-accent)" opacity="0.5" />
        <text x="82" y="16.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="#08090a">W</text>
      </svg>
    </ArtFrame>
  );
}

export function LearningArt() {
  return (
    <ArtFrame className="learning-image" tag="~/notes --recursive">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Grid n={6} opacity={0.08} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={16 + i * 4} y={62 - i * 6} width="46" height="10" rx="1.5" fill="none" stroke="var(--art-accent)" strokeOpacity={0.55 - i * 0.12} strokeWidth="0.5" transform={`rotate(${-6 + i * 4} ${39 + i * 4} ${67 - i * 6})`} />
        ))}
        <text x="30" y="26" fontSize="7" fontFamily="ui-monospace,monospace" fill="var(--art-accent)" opacity="0.7">{"</>"}</text>
        <text x="55" y="20" fontSize="5" fontFamily="ui-monospace,monospace" fill="#fff" opacity="0.3">01001</text>
        <text x="68" y="34" fontSize="5" fontFamily="ui-monospace,monospace" fill="#fff" opacity="0.25">docs/</text>
        <text x="18" y="88" fontSize="4.5" fontFamily="ui-monospace,monospace" fill="#fff" opacity="0.3">learning.log</text>
      </svg>
    </ArtFrame>
  );
}

export function PerspectiveArt() {
  const peaks = "M0,70 L14,42 L22,58 L34,24 L46,54 L58,36 L70,60 L82,30 L92,52 L100,44 L100,100 L0,100 Z";
  return (
    <ArtFrame className="perspective-image" tag="27.7°N, 85.9°E — Nepal">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Grid n={6} opacity={0.07} />
        <path d={peaks} fill="var(--art-accent)" opacity="0.1" />
        <path d={peaks} fill="none" stroke="var(--art-accent)" strokeWidth="0.6" opacity="0.6" />
        {[80, 86, 92].map((y, i) => <path key={y} d={`M0,${y} Q50,${y - 6} 100,${y}`} fill="none" stroke="#fff" strokeOpacity={0.14 - i * 0.03} strokeWidth="0.4" />)}
        <circle cx="80" cy="20" r="6" fill="#fff" opacity="0.15" />
      </svg>
    </ArtFrame>
  );
}

export function AppScreenshotArt({ variant = 1 }: { variant?: 1 | 2 }) {
  return (
    <ArtFrame tag={variant === 1 ? "app/dashboard.tsx" : "app/settings.tsx"}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Grid n={8} opacity={0.08} />
        <rect x="8" y="10" width="20" height="80" rx="2" fill="none" stroke="#fff" strokeOpacity="0.16" />
        {[18, 26, 34, 42].map((y) => <rect key={y} x="12" y={y} width="12" height="2" rx="1" fill={y === 18 ? "var(--art-accent)" : "#fff"} opacity={y === 18 ? 0.7 : 0.18} />)}
        {variant === 1 ? (
          <>
            <rect x="34" y="10" width="58" height="30" rx="2" fill="var(--art-accent)" opacity="0.1" stroke="var(--art-accent)" strokeOpacity="0.4" strokeWidth="0.4" />
            <rect x="34" y="44" width="27" height="36" rx="2" fill="none" stroke="#fff" strokeOpacity="0.14" />
            <rect x="65" y="44" width="27" height="36" rx="2" fill="none" stroke="#fff" strokeOpacity="0.14" />
          </>
        ) : (
          <>
            {[14, 24, 34, 44, 54].map((y) => <rect key={y} x="34" y={y + 4} width="58" height="7" rx="1.5" fill="none" stroke="#fff" strokeOpacity="0.14" />)}
            <rect x="34" y="66" width="20" height="7" rx="3.5" fill="var(--art-accent)" opacity="0.5" />
          </>
        )}
      </svg>
    </ArtFrame>
  );
}

export function ProjectGlyphArt({ letter, color, className = "" }: { letter: string; color: string; className?: string }) {
  return (
    <ArtFrame accent={color} className={`art-surface-thumb ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Grid n={6} opacity={0.1} />
        <circle cx="50" cy="46" r="26" fill="none" stroke="var(--art-accent)" strokeWidth="0.5" opacity="0.5" />
        <text x="50" y="58" textAnchor="middle" fontSize="34" fontWeight="800" fontFamily="ui-monospace,monospace" fill="var(--art-accent)" opacity="0.85">{letter}</text>
      </svg>
    </ArtFrame>
  );
}

export function LabArt() {
  return (
    <ArtFrame className="lab-image" tag="scene.blend → render 3D">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <Grid n={6} opacity={0.09} />
        <g fill="none" stroke="var(--art-accent)" strokeWidth="0.5" opacity="0.65">
          <path d="M30,30 L62,22 L78,38 L46,46 Z" />
          <path d="M30,30 L30,64 L46,80 L46,46 Z" />
          <path d="M46,46 L78,38 L78,72 L46,80 Z" />
          <line x1="30" y1="30" x2="46" y2="46" />
          <line x1="62" y1="22" x2="78" y2="38" />
        </g>
        <circle cx="46" cy="46" r="1.6" fill="var(--art-accent)" />
        <text x="16" y="90" fontSize="4.5" fontFamily="ui-monospace,monospace" fill="#fff" opacity="0.3">vertices: 1,204</text>
      </svg>
    </ArtFrame>
  );
}
