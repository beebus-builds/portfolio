import Link from "next/link";
import type { Metadata } from "next";
import FlightOverlay from "@/components/site/FlightOverlay";
import SectionHeading from "@/components/site/SectionHeading";
import SiteFooter from "@/components/site/SiteFooter";
import SiteNavbar from "@/components/site/SiteNavbar";
import { planets, profile, skills } from "@/lib/profile";
import { projects, repoUrl } from "@/lib/projects";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role} in ${profile.location}`,
  description: `${profile.bio[0]} Based in ${profile.location}. ${profile.status}.`,
};

const FEATURED_SLUGS = ["ivote", "pharma-connect", "nico-paz"];

function featuredProjects() {
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const picked = FEATURED_SLUGS.flatMap((slug) => {
    const project = bySlug.get(slug);
    return project ? [project] : [];
  });
  return picked.length > 0 ? picked : projects.slice(0, 3);
}

export default function Home() {
  const topSkills = [...skills].sort((a, b) => b.level - a.level).slice(0, 4);

  return (
    <div className="site">
      <SiteNavbar />

      <main className="site__main" id="document">
        {/* ---------- hero ---------- */}
        <section className="site-hero" aria-labelledby="hero-title">
          <p className="site-hero__eyebrow">
            <i aria-hidden="true" /> {profile.status} · {profile.callSign} · {profile.timezone}
          </p>
          <h1 className="site-hero__title" id="hero-title">
            Bibash <em>Poudel</em>
          </h1>
          <p className="site-hero__role">
            {profile.role} · {profile.location}
          </p>
          <p className="site-hero__lede">{profile.bio[0]}</p>
          <div className="site-hero__actions">
            <Link className="btn" href="/projects">
              View projects →
            </Link>
            <Link className="btn btn--ghost" href="/flight">
              Enter the flight ↗
            </Link>
            <Link className="btn btn--ghost" href="/contact">
              Get in touch
            </Link>
          </div>
          <ul className="site-hero__stats" aria-label="At a glance">
            <li>
              <b>{projects.length}</b>
              <small>Missions shipped</small>
            </li>
            <li>
              <b>{skills.length}</b>
              <small>Skill clusters</small>
            </li>
            <li>
              <b>{profile.timezone}</b>
              <small>Working hours</small>
            </li>
            <li>
              <b>{planets.length}</b>
              <small>Worlds to explore</small>
            </li>
          </ul>
        </section>

        {/* ---------- about preview ---------- */}
        <section className="site-section" aria-labelledby="about-title">
          <SectionHeading
            kicker="01 / Origin"
            title="Interfaces with intent, backends that hold their weight"
            lede={profile.bio[1]}
            moreHref="/about"
            moreLabel="Full story"
          />
          <ul className="fact-grid">
            <li>
              <span className="panel-label">Call sign</span>
              <b>{profile.callSign}</b>
            </li>
            <li>
              <span className="panel-label">Based</span>
              <b>{profile.location}</b>
            </li>
            <li>
              <span className="panel-label">Coordinates</span>
              <b>{profile.coordinates}</b>
            </li>
            <li>
              <span className="panel-label">Status</span>
              <b>{profile.status}</b>
            </li>
          </ul>
        </section>

        {/* ---------- skills preview ---------- */}
        <section className="site-section" aria-labelledby="skills-title">
          <SectionHeading
            kicker="02 / Capability"
            title="What I can actually build"
            lede="Eight clusters, tuned by shipping rather than by certification. Here are the four I reach for most."
            moreHref="/skills"
            moreLabel="All skills"
          />
          <div>
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
        </section>

        {/* ---------- featured projects ---------- */}
        <section className="site-section" aria-labelledby="projects-title">
          <SectionHeading
            kicker="03 / Archive"
            title="Selected missions"
            lede="Three builds that show the range: encrypted systems, local logistics, and bilingual themes. The full archive holds six."
            moreHref="/projects"
            moreLabel="All projects"
          />
          <ul className="site-grid">
            {featuredProjects().map((project) => (
              <li
                className="site-card"
                key={project.slug}
                style={{ ["--planet" as string]: project.color }}
              >
                <span className="site-card__kicker">
                  {project.tag} · {project.year}
                </span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <ul className="site-card__tags" aria-label="Technologies">
                  {project.tech.slice(0, 4).map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
                <p className="site-card__meta">
                  <Link className="text-link" href={`/projects/${project.slug}`}>
                    Case study →
                  </Link>{" "}
                  ·{" "}
                  <a href={repoUrl(project)} target="_blank" rel="noreferrer">
                    Source ↗
                  </a>
                  {project.url && (
                    <>
                      {" "}
                      ·{" "}
                      <a href={project.url} target="_blank" rel="noreferrer">
                        Live ↗
                      </a>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- flight teaser ---------- */}
        <section className="site-section" aria-labelledby="flight-title">
          <div className="flight-teaser">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <p className="section-head__kicker">04 / The scenic route</p>
              <h2 className="section-head__title" id="flight-title">
                Or fly it instead
              </h2>
              <p className="section-head__lede">
                The whole portfolio is also a space flight: steer the ship, dock with five
                planets, and read each section as a world. Pick a world to fly straight there.
              </p>
            </div>
            <ul className="flight-teaser__planets">
              {planets.map((planet) => (
                <li key={planet.id}>
                  <Link
                    href={`/flight?planet=${planet.id}`}
                    style={{ ["--planet" as string]: planet.glowColor }}
                  >
                    <span className="flight-teaser__dot" aria-hidden="true" />
                    <b>{planet.label}</b>
                    <small>
                      {planet.title} · {planet.readout}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
            <div>
              <Link className="btn" href="/flight">
                Begin flight ↗
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- contact preview ---------- */}
        <section className="site-section" aria-labelledby="contact-title">
          <SectionHeading
            kicker="05 / Comms"
            title="An open channel"
            lede={`Tell me what you are building, what is broken, or what you want to understand next. ${profile.responseWindow}.`}
            moreHref="/contact"
            moreLabel="Contact page"
          />
          <ul className="site-grid">
            {profile.links.map((link) => (
              <li className="site-card" key={link.label}>
                <span className="site-card__kicker">{link.label}</span>
                <h3>{link.value}</h3>
                <p>{link.note}</p>
                <p className="site-card__meta">
                  <a href={link.href} target="_blank" rel="noreferrer">
                    Open ↗
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
      <FlightOverlay />
    </div>
  );
}
