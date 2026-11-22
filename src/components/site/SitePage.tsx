import type { CSSProperties, ReactNode } from "react";
import PageBar from "./PageBar";

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

/**
 * Page shell: the quiet top bar, the reading column and, when a page has
 * one, its 3D window. `accent` themes every component on the page.
 */
export default function SitePage({
  hero,
  children,
  aside,
  accent,
  current,
}: {
  hero: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  accent?: string;
  current?: string;
}) {
  return (
    <div
      className="page"
      data-stage={aside ? "" : undefined}
      style={accent ? ({ "--accent": accent } as CSSProperties) : undefined}
    >
      <PageBar current={current} />
      <div className="page__grid">
        <main className="page__main" id="document">
          {hero}
          {children}
        </main>
        {aside}
      </div>
    </div>
  );
}
