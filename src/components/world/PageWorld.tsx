"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import type { World } from "@/lib/pageWorlds";

const WorldScene = dynamic(() => import("./WorldScene"), { ssr: false });

export type RailSection = { id: string; title: string };

function hasWebgl() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * A page's 3D window: the room framed beside the text, a caption naming the
 * section being read, and the page's contents. The window shares the
 * "stage" view-transition name with the homepage room, so navigating between
 * them morphs one into the other.
 */
export default function PageWorld({ world, sections }: { world: World; sections: RailSection[] }) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);
  const progress = useRef(0);

  useEffect(() => {
    setWebgl(hasWebgl());
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);

  // Scroll progress drives the camera without re-rendering React.
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? window.scrollY / max : 0;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // The section crossing the upper third of the screen is the one being read;
  // sections rise into place the first time they scroll into view.
  useEffect(() => {
    const elements = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    const reading = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px" }
    );
    document.documentElement.setAttribute("data-reveal", "");
    elements.forEach((el) => {
      reading.observe(el);
      reveal.observe(el);
    });
    return () => {
      reading.disconnect();
      reveal.disconnect();
      document.documentElement.removeAttribute("data-reveal");
    };
  }, [sections]);

  // Cards lean toward the pointer.
  useEffect(() => {
    if (reduced || !window.matchMedia?.("(hover: hover)").matches) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".doc .site-card"));
    const move = (event: PointerEvent) => {
      const card = event.currentTarget as HTMLElement;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
      card.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
    };
    const leave = (event: PointerEvent) => {
      const card = event.currentTarget as HTMLElement;
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    };
    cards.forEach((card) => {
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
    });
    return () =>
      cards.forEach((card) => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
      });
  }, [reduced]);

  const go = useCallback(
    (target: string) => {
      const el = document.getElementById(target);
      if (!el) return;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", `#${target}`);
      el.classList.remove("is-pinged");
      void el.offsetWidth;
      el.classList.add("is-pinged");
    },
    [reduced]
  );

  const activeIndex = Math.max(0, sections.findIndex((s) => s.id === active));
  const activeSection = sections[activeIndex];

  return (
    <aside className="page__stage" aria-label="Room view and contents">
      <ViewTransition name="stage" share="stage-morph" default="none">
        <figure className="stage">
          <div className="stage__canvas" aria-hidden="true">
            {webgl && <WorldScene world={world} progress={progress} active={active} dark reduced={reduced} onSelect={go} />}
          </div>
          <figcaption className="stage__caption">
            <span className="kicker">{world.title}</span>
            <span className="stage__now" aria-live="polite">
              <span className="stage__index">{String(activeIndex + 1).padStart(2, "0")}</span>
              {activeSection?.title}
            </span>
            {webgl && <span className="stage__hint">Drag the cursor, scroll, or click an object to jump to it</span>}
          </figcaption>
        </figure>
      </ViewTransition>

      <nav className="toc" aria-label="On this page">
        <p className="kicker">Contents</p>
        <ol>
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  go(section.id);
                }}
              >
                <span className="toc__index">{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
