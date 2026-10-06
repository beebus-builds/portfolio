import Link from "next/link";
import type { Metadata } from "next";
import SectionContent from "@/components/space/SectionContent";
import SectionHeading from "@/components/site/SectionHeading";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { profile } from "@/lib/profile";
import { testimonials } from "@/lib/testimonials";

export const metadata: Metadata = {
  title: `About — ${profile.name}`,
  description: `${profile.bio[0]} Based in ${profile.location} (${profile.timezone}).`,
};

const PRINCIPLES = [
  {
    title: "Interfaces with intent",
    body: "Every interaction earns its place. If a 300ms detail makes the product feel human, it is worth chasing.",
  },
  {
    title: "Backends that hold weight",
    body: "Typed APIs, honest schemas, and infrastructure chosen for the traffic you actually have.",
  },
  {
    title: "Plumbing kept honest",
    body: "The unglamorous middle — caching, CI, audits — is what lets both sides above survive contact with users.",
  },
];

export default function AboutPage() {
  return (
    <SitePage
      hero={
        <PageHero
          kicker="01 / Origin — Verdania"
          title="The pilot behind the ship"
          lede="I build digital systems that feel a little more human — and I like small teams, hard problems, and products where the details are the point."
          meta={[profile.location, profile.timezone, profile.status]}
        />
      }
    >
      <section className="site-section" aria-label="Profile">
        <div className="doc">
          <SectionContent id="about" />
        </div>
      </section>

      <section className="site-section" aria-labelledby="about-principles">
        <SectionHeading
          kicker="How I work"
          title="Three principles, one checklist"
          lede="Pulled straight from the bio above — this is how I judge my own work before anyone else sees it."
        />
        <ul className="site-grid" id="about-principles">
          {PRINCIPLES.map((principle, index) => (
            <li className="site-card" key={principle.title}>
              <span className="site-card__kicker">0{index + 1}</span>
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" aria-labelledby="about-testimonials">
        <SectionHeading
          kicker="Signals received"
          title="What people say after launch"
          lede="Unedited notes from the people who hired me. Specific projects, specific outcomes."
        />
        <ul className="site-grid" id="about-testimonials">
          {testimonials.map((t, index) => (
            <li className="site-card" key={t.name}>
              <span className="site-card__kicker">0{index + 1} — {t.project}</span>
              <h3>&ldquo;{t.quote}&rdquo;</h3>
              <p>
                <b>{t.name}</b> · {t.role}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" aria-label="Keep reading">
        <div className="flight-teaser">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="section-head__kicker">Next</p>
            <h2 className="section-head__title">See what this turns into</h2>
            <p className="section-head__lede">
              Principles are cheap — the proof is in the instrument panel and the archive.
            </p>
          </div>
          <div className="site-hero__actions" style={{ marginBottom: 0 }}>
            <Link className="btn" href="/skills">
              Skills →
            </Link>
            <Link className="btn btn--ghost" href="/projects">
              Projects
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
