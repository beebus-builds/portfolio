import Link from "next/link";
import { planets, profile } from "@/lib/profile";

/** Shared footer: identity, section index, and off-site channels. */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <b>{profile.name.toUpperCase()}</b>
          <p>
            {profile.role} based in {profile.location}. {profile.status} —{" "}
            {profile.responseWindow.toLowerCase()}.
          </p>
          <p>
            Prefer the scenic route?{" "}
            <Link className="text-link" href="/flight">
              Fly the ship ↗
            </Link>
          </p>
        </div>
        <nav aria-label="Sections">
          <span className="site-footer__label">Index</span>
          <Link href="/about">About</Link>
          <Link href="/skills">Skills</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/resume">Resume</Link>
        </nav>
        <nav aria-label="Elsewhere">
          <span className="site-footer__label">Elsewhere</span>
          {profile.links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label} ↗
            </a>
          ))}
          <span className="site-footer__label" style={{ marginTop: "14px" }}>
            Worlds
          </span>
          {planets.map((planet) => (
            <Link key={planet.id} href={`/flight?planet=${planet.id}`}>
              {planet.label} · {planet.title}
            </Link>
          ))}
        </nav>
      </div>
      <p className="site-footer__base">
        © 2026 {profile.name} · {profile.callSign} · {profile.coordinates} · Built with Next.js
        and Three.js
      </p>
    </footer>
  );
}
