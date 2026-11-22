import Link from "next/link";
import { ROUTES } from "@/lib/studio";

/**
 * The only chrome on a page: a way back to the desk and the index of rooms.
 * Kept deliberately quiet so the page and its 3D window carry the design.
 */
export default function PageBar({ current }: { current?: string }) {
  return (
    <header className="page-bar">
      <Link href="/" className="page-bar__home">
        <span aria-hidden="true">←</span> Back to the desk
      </Link>
      <nav aria-label="Rooms">
        <ol className="page-bar__rooms">
          <li>
            <Link href="/summary" className="page-bar__summary" aria-current={current === "summary" ? "page" : undefined}>
              Summary
            </Link>
          </li>
          {ROUTES.map((route) => (
            <li key={route.slug}>
              <Link href={route.href} aria-current={route.slug === current ? "page" : undefined}>
                {route.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  );
}

/** Editorial sign-off: the previous room and, larger, the next one. */
export function NextRoom({ current }: { current: string }) {
  const index = ROUTES.findIndex((route) => route.slug === current);
  if (index === -1) return null;
  const next = ROUTES[(index + 1) % ROUTES.length]!;
  const previous = ROUTES[(index - 1 + ROUTES.length) % ROUTES.length]!;
  return (
    <nav className="next-room" aria-label="More rooms">
      <Link href={previous.href} className="next-room__prev">
        <span className="kicker">Previous room</span>
        <span>← {previous.label}</span>
      </Link>
      <Link href={next.href} className="next-room__next">
        <span className="kicker">Next room</span>
        <span className="next-room__title">{next.label} →</span>
        <span className="next-room__blurb">{next.blurb}</span>
      </Link>
    </nav>
  );
}
