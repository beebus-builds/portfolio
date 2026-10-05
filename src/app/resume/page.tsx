import Link from "next/link";
import type { Metadata } from "next";
import SectionContent from "@/components/space/SectionContent";
import SectionHeading from "@/components/site/SectionHeading";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { profile, skills } from "@/lib/profile";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: `Resume — ${profile.name}`,
  description: `The one-page flight log of ${profile.name}: full-stack product engineering across Next.js, TypeScript, Node and PostgreSQL, plus ${projects.length} shipped case studies. PDF download included.`,
};

export default function ResumePage() {
  const topSkills = [...skills].sort((a, b) => b.level - a.level).slice(0, 4);

  return (
    <SitePage
      hero={
        <PageHero
          kicker="05 / Record — Cartograph"
          title="The flight log, one page"
          lede="Experience, the tools I reach for, and the missions that prove I can finish things. Sized for both a recruiter skim and a full read."
          meta={["One-page PDF", "Updated 2026", profile.status]}
        />
      }
    >
      <section className="site-section" aria-label="Resume">
        <div className="doc">
          <SectionContent id="resume" />
        </div>
      </section>

      <section className="site-section" aria-labelledby="resume-proof">
        <SectionHeading
          kicker="The proof behind the page"
          title="What the one-pager summarizes"
          lede="A resume claims — these two sections verify. Strongest skills first, then the missions that earned them."
        />
        <div id="resume-proof">
          {topSkills.map((skill) => (
            <div className="skill-row" key={skill.name}>
              <div className="skill-row__head">
                <b>{skill.name}</b>
                <span>{skill.level}</span>
              </div>
              <small>{skill.detail}</small>
              <i className="skill-bar">
                <span style={{ width: `${skill.level}%` }} />
              </i>
            </div>
          ))}
        </div>
        <ul className="site-grid" style={{ marginTop: "22px" }}>
          {projects.map((project) => (
            <li className="site-card" key={project.slug}>
              <span className="site-card__kicker">
                {project.tag} · {project.year}
              </span>
              <h3>{project.title}</h3>
              <p>{project.outcome}</p>
              <p className="site-card__meta">
                <Link className="text-link" href={`/projects/${project.slug}`}>
                  Case study →
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" aria-label="Keep reading">
        <div className="flight-teaser">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="section-head__kicker">Next</p>
            <h2 className="section-head__title">Convinced? Say hello</h2>
            <p className="section-head__lede">
              The log is downloaded — now open a channel. {profile.responseWindow}.
            </p>
          </div>
          <div className="site-hero__actions" style={{ marginBottom: 0 }}>
            <Link className="btn" href="/contact">
              Contact →
            </Link>
            <Link className="btn btn--ghost" href="/flight">
              Or fly the ship
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
