import type { Metadata } from "next";
import Link from "next/link";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { anchorId } from "@/lib/anchors";
import { experience } from "@/lib/experience";
import { profile, skills } from "@/lib/profile";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: `${profile.name} — one-page summary`,
  description: `${profile.name}, ${profile.role} in ${profile.location}: availability, featured projects, skills and experience on one page.`,
  alternates: { canonical: "/summary" },
};

/**
 * The fast path for busy readers: everything a recruiter needs to decide on
 * a call, without walking through the 3D room.
 */
export default function SummaryPage() {
  const email = profile.links.find((link) => link.label === "Email");
  const featured = projects.slice(0, 3);
  const topSkills = [...skills].sort((a, b) => b.level - a.level).slice(0, 6);

  return (
    <SitePage
      current="summary"
      hero={
        <PageHero
          kicker="One-page summary"
          title={profile.name}
          lede={`${profile.role} in ${profile.location}. I build products end to end — interface, API, database and deployment.`}
          meta={[profile.status, profile.responseWindow, profile.timezone]}
        />
      }
    >
      <div className="doc">
        <section className="doc-section" aria-labelledby="sum-reach">
          <div className="section-head">
            <p className="section-head__kicker">01 / Reach me</p>
            <h2 className="section-head__title" id="sum-reach">
              The short version
            </h2>
          </div>
          <div className="doc-section__body">
            <div className="prose-block">
              <p>{profile.bio[0]}</p>
            </div>
            <div className="site-hero__actions">
              {email && (
                <a className="btn" href={email.href}>
                  Email {email.value}
                </a>
              )}
              <a className="btn btn--ghost" href="/resume.pdf" download>
                Download résumé (PDF)
              </a>
              <Link className="btn btn--ghost" href="/contact">
                Contact form
              </Link>
            </div>
          </div>
        </section>

        <section className="doc-section" aria-labelledby="sum-work">
          <div className="section-head">
            <p className="section-head__kicker">02 / Featured work</p>
            <h2 className="section-head__title" id="sum-work">
              Three projects worth a look
            </h2>
          </div>
          <ul className="site-grid">
            {featured.map((project) => (
              <li className="site-card" key={project.slug}>
                <p className="site-card__kicker">
                  {project.tag} · {project.year}
                </p>
                <h3>
                  <Link href={`/projects#${anchorId(project.title)}`}>{project.title}</Link>
                </h3>
                <p>{project.description}</p>
                <ul className="site-card__tags">
                  {project.tech.slice(0, 4).map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="doc-section" aria-labelledby="sum-skills">
          <div className="section-head">
            <p className="section-head__kicker">03 / Strongest skills</p>
            <h2 className="section-head__title" id="sum-skills">
              Where I’m most useful
            </h2>
          </div>
          <ul className="site-metrics">
            {topSkills.map((skill) => (
              <li key={skill.name}>
                <b>{skill.level}%</b>
                <span>{skill.name}</span>
                <small>{skill.detail}</small>
              </li>
            ))}
          </ul>
        </section>

        <section className="doc-section" aria-labelledby="sum-exp">
          <div className="section-head">
            <p className="section-head__kicker">04 / Experience</p>
            <h2 className="section-head__title" id="sum-exp">
              Where I’ve worked
            </h2>
          </div>
          <ol className="site-timeline">
            {experience.map((role) => (
              <li key={role.company + role.period}>
                <span className="site-timeline__when">{role.period}</span>
                <h3>{role.role}</h3>
                <p>
                  {role.company} · {role.location}
                </p>
                {role.points[0] && <p>{role.points[0]}</p>}
              </li>
            ))}
          </ol>
        </section>

        <div className="page-end">
          <h2>Want the full story?</h2>
          <p>The studio has a room for each part of the work, with case studies, process and the details behind them.</p>
          <div className="site-hero__actions">
            <Link className="btn" href="/">
              Step into the studio
            </Link>
            <Link className="btn btn--ghost" href="/projects">
              All projects
            </Link>
          </div>
        </div>
      </div>
    </SitePage>
  );
}
