import Link from "next/link";
import { profile } from "@/lib/profile";

/** Shared footer: identity, the page index, and off-site channels. */
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
            The flight is still the front door.{" "}
            <Link className="text-link" href="/">
              Fly the ship ↗
            </Link>
          </p>
        </div>
        <nav aria-label="Sections">
          <span className="site-footer__label">Index</span>
          <Link href="/about">About</Link>
          <Link href="/skills">Skills</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/services">Services</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <nav aria-label="Elsewhere">
          <span className="site-footer__label">Elsewhere</span>
          {profile.links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label} ↗
            </a>
          ))}
          <span className="site-footer__label" style={{ marginTop: "14px" }}>
            More
          </span>
          <Link href="/experience">Experience</Link>
          <Link href="/resume">Resume</Link>
          <Link href="/stats">Stats</Link>
          <Link href="/blog">Logbook</Link>
        </nav>
      </div>
      <p className="site-footer__base">
        © 2026 {profile.name} · {profile.callSign} · {profile.coordinates} · Built with Next.js
        and Three.js
      </p>
    </footer>
  );
}
