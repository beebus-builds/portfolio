"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HOME_SECTIONS } from "./sections-map";

export default function SectionRail() {
  const pathname = usePathname();
  const [active, setActive] = useState(HOME_SECTIONS[0].id);

  useEffect(() => {
    if (pathname !== "/") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    const els = HOME_SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  if (pathname !== "/") return null;

  return (
    <nav className="section-rail" aria-label="Section navigation">
      {HOME_SECTIONS.map((s) => (
        <a key={s.id} href={`#${s.id}`} className={`section-rail-dot ${active === s.id ? "active" : ""}`} aria-label={`${s.num} ${s.label}`}>
          <span className="section-rail-tip">{s.num} · {s.label}</span>
        </a>
      ))}
    </nav>
  );
}
