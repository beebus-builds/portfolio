import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import SiteNavbar from "@/components/site/SiteNavbar";
import { profile } from "@/lib/profile";

/** A few useful streets out of a dead end — straight into the districts. */
const RECOVERY = [
  { href: "/projects", label: "The projects", note: "Everything I have built, in one place" },
  { href: "/about", label: "About town", note: "Who builds here and why" },
  { href: "/contact", label: "Reach out", note: "Tell me what you need" },
];

/** The classic pages, laid out like blocks in the city. */
const DISTRICTS = [
  { id: "about", kicker: "01 / ORIGIN", title: "About", blurb: "Who is behind the work, and why it exists.", color: "#4fb8ff", href: "/about" },
  { id: "skills", kicker: "02 / CAPABILITY", title: "Skills", blurb: "What I can actually build.", color: "#a78bfa", href: "/skills" },
  { id: "projects", kicker: "03 / ARCHIVE", title: "Projects", blurb: "The things I pulled apart, rebuilt, and shipped.", color: "#ff9f45", href: "/projects" },
  { id: "contact", kicker: "04 / COMMS", title: "Contact", blurb: "An open line. Say hello and get a reply.", color: "#34e5a1", href: "/contact" },
  { id: "resume", kicker: "05 / RECORD", title: "Resume", blurb: "The printed record, one page, downloadable.", color: "#ff6b9d", href: "/resume" },
];

export default function NotFound() {
  return (
    <div className="site">
      <SiteNavbar />

      <main className="site__main" id="document">
        <header className="page-hero">
          <p className="section-head__kicker">Error 404 · {profile.name}</p>
          <h1>Lost in the city</h1>
          <p className="page-hero__lede">
            This address is not on any map in Bibashville. The city is still standing —
            pick another street and keep exploring.
          </p>
          <ul className="page-hero__meta">
            <li>Path unresolved</li>
            <li>City systems nominal</li>
          </ul>
        </header>

        <section className="site-section" aria-labelledby="recovery-title">
          <div className="section-head">
            <p className="section-head__kicker">Recovery</p>
            <h2 className="section-head__title" id="recovery-title">
              Three ways back to the map
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

        <section className="site-section" aria-labelledby="districts-title">
          <div className="section-head">
            <p className="section-head__kicker">Index</p>
            <h2 className="section-head__title" id="districts-title">
              Or head straight to a district
            </h2>
          </div>
          <ul className="site-grid">
            {DISTRICTS.map((district) => (
              <li className="site-card" key={district.id} style={{ ["--planet" as string]: district.color }}>
                <span className="site-card__kicker">{district.kicker}</span>
                <h3>
                  <Link className="text-link" href={district.href}>
                    {district.title}
                  </Link>
                </h3>
                <p>{district.blurb}</p>
                <p className="site-card__meta">
                  <Link className="text-link" href={district.href}>
                    Visit →
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="site-section">
          <Link className="btn" href="/">
            Return to the city ↗
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
