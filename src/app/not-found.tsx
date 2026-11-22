import Link from "next/link";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { ROUTES } from "@/lib/studio";

export default function NotFound() {
  return (
    <SitePage
      hero={
        <PageHero
          kicker="Error 404"
          title="Lost in the hallway"
          lede="This door doesn’t lead anywhere. Every room in the studio is still open — pick one."
          meta={["Path unresolved", "Studio systems nominal"]}
        />
      }
    >
      <section className="doc-section" aria-labelledby="rooms-title">
        <div className="section-head">
          <p className="section-head__kicker">The rooms</p>
          <h2 className="section-head__title" id="rooms-title">
            Where would you like to go?
          </h2>
        </div>
        <ul className="site-grid">
          {ROUTES.map((route) => (
            <li className="site-card" key={route.slug}>
              <span className="site-card__kicker">Room {route.key}</span>
              <h3>
                <Link href={route.href}>{route.label}</Link>
              </h3>
              <p>{route.blurb}</p>
            </li>
          ))}
        </ul>
      </section>
      <div className="page-end">
        <div className="site-hero__actions">
          <Link className="btn" href="/">
            ← Back to the desk
          </Link>
        </div>
      </div>
    </SitePage>
  );
}
