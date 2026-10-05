import type { ReactNode } from "react";
import FlightOverlay from "./FlightOverlay";
import SiteFooter from "./SiteFooter";
import SiteNavbar from "./SiteNavbar";

export function PageHero({
  kicker,
  title,
  lede,
  meta,
}: {
  kicker: string;
  title: string;
  lede: string;
  meta?: string[];
}) {
  return (
    <header className="page-hero">
      <p className="section-head__kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="page-hero__lede">{lede}</p>
      {meta && meta.length > 0 && (
        <ul className="page-hero__meta">
          {meta.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </header>
  );
}

/** Classic page shell: navbar, document main, footer, flight overlay. */
export default function SitePage({ hero, children }: { hero: ReactNode; children: ReactNode }) {
  return (
    <div className="site">
      <SiteNavbar />
      <main className="site__main" id="document">
        {hero}
        {children}
      </main>
      <SiteFooter />
      <FlightOverlay />
    </div>
  );
}
