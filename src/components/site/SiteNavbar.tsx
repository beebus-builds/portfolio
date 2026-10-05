"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { profile } from "@/lib/profile";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/skills", label: "Skills" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
  { href: "/resume", label: "Resume" },
];

/** Sticky site navbar: shared by the homepage and all five section pages. */
export default function SiteNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Collapse the mobile menu on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <header className="site-nav">
      <div className="site-nav__inner" data-open={open || undefined}>
        <Link className="site-nav__brand" href="/" aria-label={`${profile.name} — home`}>
          <span className="site-nav__mark" aria-hidden="true">
            BP
          </span>
          {profile.callSign}
        </Link>
        <button
          type="button"
          className="site-nav__toggle"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <div className="site-nav__menu" id="site-menu">
          <nav aria-label="Sections">
            <ul className="site-nav__links">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link className="site-nav__cta" href="/flight">
            Enter flight ↗
          </Link>
        </div>
      </div>
    </header>
  );
}
