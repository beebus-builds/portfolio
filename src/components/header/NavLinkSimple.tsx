"use client";

import Link from "next/link";

export default function NavLinkSimple({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`nav-link text-[11px] font-mono tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm ${
        active ? "text-neon-400" : "text-white/50 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
