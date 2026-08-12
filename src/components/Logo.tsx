export default function Logo({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#101516" />
          <stop offset="100%" stopColor="#1b2224" />
        </linearGradient>
        <linearGradient id="logo-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#54e6d4" />
          <stop offset="100%" stopColor="#3bcfbc" />
        </linearGradient>
      </defs>

      {/* Tile */}
      <rect x="1.5" y="1.5" width="45" height="45" rx="11" fill="url(#logo-bg)" stroke="url(#logo-edge)" strokeWidth="2" />

      {/* Matrix grid dots */}
      <circle cx="9" cy="12" r="1" fill="#54e6d4" opacity="0.25" />
      <circle cx="39" cy="12" r="1" fill="#54e6d4" opacity="0.25" />
      <circle cx="9" cy="36" r="1" fill="#54e6d4" opacity="0.25" />
      <circle cx="39" cy="36" r="1" fill="#54e6d4" opacity="0.25" />

      {/* "Bibash" monogram as the prompt */}
      <text
        x="8"
        y="31.5"
        fontFamily="'Anonymous Pro', 'Courier New', monospace"
        fontSize="26"
        fontWeight="700"
        fill="#54e6d4"
      >
        B
      </text>

      {/* Terminal cursor */}
      <rect x="29.5" y="13" width="4.5" height="17" rx="1.5" fill="#54e6d4">
        <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}