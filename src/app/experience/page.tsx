import type { Metadata } from "next";
import Link from "next/link";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { experience } from "@/lib/experience";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `Experience — ${profile.name}`,
  description: `Where ${profile.name} has shipped software: independent client work, campus tools, and early WordPress experiments.`,
};

export default function ExperiencePage() {
  return (
    <SitePage
      hero={
        <PageHero
          kicker="06 / Flight Recorder"
          title="The flight recorder"
          lede="Every role, every stint, every late-night fix — logged in order. The honest version of a resume."
          meta={[`${experience.length} entries`, "2020 — present", profile.status]}
        />
      }
    >
      <section className="site-section" aria-label="Experience timeline">
        <ol className="site-grid" style={{ listStyle: "none", padding: 0 }}>
          {experience.map((entry, index) => (
            <li className="site-card" key={entry.company}>
              <span className="site-card__kicker">{entry.period}</span>
              <h3>{entry.role}</h3>
              <p>
                <b>{entry.company}</b> · {entry.location}
              </p>
              <ul>
                {entry.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              {index === 0 && <span className="site-card__kicker">Current</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="site-section" aria-label="Keep reading">
        <div className="flight-teaser">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="section-head__kicker">Next</p>
            <h2 className="section-head__title">Read the logbook</h2>
            <p className="section-head__lede">
              Experience is the headline — the posts are where the details land.
            </p>
          </div>
          <div className="site-hero__actions" style={{ marginBottom: 0 }}>
            <Link className="btn" href="/blog">
              Open the blog →
            </Link>
            <Link className="btn btn--ghost" href="/projects">
              See the missions
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
