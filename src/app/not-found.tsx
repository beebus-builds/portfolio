import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import SiteNavbar from "@/components/site/SiteNavbar";
import { planets, profile } from "@/lib/profile";

/** A few useful vectors out of a dead end — straight into the worlds. */
const RECOVERY = [
  { href: "/?planet=projects", label: "The archive", note: "Every shipped mission, in the field" },
  { href: "/?planet=about", label: "Origin", note: "Who is flying this ship" },
  { href: "/?planet=contact", label: "Open a channel", note: "Ask for what you need" },
];

export default function NotFound() {
  return (
    <div className="site">
      <SiteNavbar />

      <main className="site__main" id="document">
        <header className="page-hero">
          <p className="section-head__kicker">Error 404 · {profile.callSign}</p>
          <h1>Nothing orbits this address</h1>
          <p className="page-hero__lede">
            The coordinates you followed do not exist in this system. The flight log is intact —
            pick another vector and keep moving.
          </p>
          <ul className="page-hero__meta">
            <li>Path unresolved</li>
            <li>Ship systems nominal</li>
          </ul>
        </header>

        <section className="site-section" aria-labelledby="recovery-title">
          <div className="section-head">
            <p className="section-head__kicker">Recovery</p>
            <h2 className="section-head__title" id="recovery-title">
              Three ways back on course
            </h2>
          </div>
          <ul className="site-grid">
            {RECOVERY.map((item) => (
              <li className="site-card" key={item.href}>
                <span className="site-card__kicker">Navigate</span>
                <h3>
                  <Link className="text-link" href={item.href}>
                    {item.label}
                  </Link>
                </h3>
                <p>{item.note}</p>
                <p className="site-card__meta">
                  <Link className="text-link" href={item.href}>
                    Go →
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="site-section" aria-labelledby="worlds-title">
          <div className="section-head">
            <p className="section-head__kicker">Index</p>
            <h2 className="section-head__title" id="worlds-title">
              Or jump straight to a world
            </h2>
          </div>
          <ul className="site-grid">
            {planets.map((planet) => (
              <li className="site-card" key={planet.id} style={{ ["--planet" as string]: planet.glowColor }}>
                <span className="site-card__kicker">{planet.kicker}</span>
                <h3>
                  <Link className="text-link" href={`/?planet=${planet.id}`}>
                    {planet.title}
                  </Link>
                </h3>
                <p>{planet.blurb}</p>
                <p className="site-card__meta">
                  <Link className="text-link" href={`/?planet=${planet.id}`}>
                    Fly there →
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="site-section">
          <Link className="btn" href="/">
            Return to the ship ↗
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
