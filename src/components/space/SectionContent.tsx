"use client";

import type { ReactElement } from "react";
import { profile, skills, type SectionId } from "@/lib/profile";
import { projects } from "@/lib/projects";
import ContactForm from "./ContactForm";

function AboutPanel() {
  return (
    <div className="panel-body">
      <div className="panel-identity">
        <div className="panel-identity__avatar" aria-hidden="true">
          <span>{profile.name.split(" ").map((part) => part[0]).join("")}</span>
        </div>
        <div>
          <h3>{profile.name}</h3>
          <p>
            {profile.role} · {profile.location}
          </p>
          <p className="panel-identity__status">
            <i data-live="true" /> {profile.status} · {profile.responseWindow}
          </p>
        </div>
      </div>

      {profile.bio.map((paragraph) => (
        <p key={paragraph.slice(0, 24)}>{paragraph}</p>
      ))}

      <div className="panel-grid">
        <div>
          <span className="panel-label">Call sign</span>
          <strong>{profile.callSign}</strong>
        </div>
        <div>
          <span className="panel-label">Coordinates</span>
          <strong>{profile.coordinates}</strong>
        </div>
        <div>
          <span className="panel-label">Timezone</span>
          <strong>{profile.timezone}</strong>
        </div>
        <div>
          <span className="panel-label">Missions logged</span>
          <strong>{projects.length}</strong>
        </div>
      </div>

      <div className="panel-links">
        {profile.links.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
            <span>
              <b>{link.label}</b>
              <small>{link.value}</small>
            </span>
            <em>{link.note}</em>
            <i aria-hidden="true">↗</i>
          </a>
        ))}
      </div>
    </div>
  );
}

const GROUP_ORDER = ["Systems", "Interface", "Platform", "Craft"] as const;

function SkillsPanel() {
  return (
    <div className="panel-body">
      <p>
        Eight clusters, tuned by shipping rather than by certification. Percentages are self-assessed
        against real delivery, not quiz scores.
      </p>
      {GROUP_ORDER.map((group) => {
        const groupSkills = skills.filter((skill) => skill.group === group);
        return (
          <section key={group} className="skill-group">
            <h4>
              {group} <span>{groupSkills.length}</span>
            </h4>
            {groupSkills.map((skill) => (
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
          </section>
        );
      })}
    </div>
  );
}

function ProjectsPanel() {
  return (
    <div className="panel-body">
      <p>
        Six builds, each with the constraint that shaped it and the outcome it produced. Open any
        mission for the full breakdown.
      </p>
      <div className="project-list">
        {projects.map((project, index) => (
          <article className="project-card" key={project.slug} style={{ borderColor: `${project.color}44` }}>
            <div className="project-card__head">
              <span className="project-card__index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4>{project.title}</h4>
                <p>
                  {project.tag} · {project.year} · {project.role}
                </p>
              </div>
            </div>
            <p className="project-card__description">{project.description}</p>
            <ul className="project-card__highlights">
              {project.highlights.slice(0, 2).map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <div className="project-card__footer">
              <div className="project-card__tech">
                {project.tech.slice(0, 4).map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>
              {project.url && (
                <a href={project.url} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} live`}>
                  Live ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ContactPanel() {
  return (
    <div className="panel-body">
      <p>
        Tell me what you are building, what is broken, or what you want to understand next. The best
        collaborations usually start as one clear question.
      </p>
      <ContactForm />
      <div className="panel-links">
        {profile.links.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
            <span>
              <b>{link.label}</b>
              <small>{link.value}</small>
            </span>
            <em>{link.note}</em>
            <i aria-hidden="true">↗</i>
          </a>
        ))}
      </div>
    </div>
  );
}

function ResumePanel() {
  return (
    <div className="panel-body">
      <p>
        The whole flight log on one page: experience, the tools I reach for, and the missions that
        prove I can finish things. PDF, sized for both a recruiter skim and a full read.
      </p>
      <a className="resume-download" href="/resume.pdf" download>
        <span>
          <b>resume.pdf</b>
          <small>One page · updated 2026</small>
        </span>
        <i aria-hidden="true">↓</i>
      </a>
      <div className="resume-facts">
        {[
          { label: "Focus", value: "Full-stack product engineering" },
          { label: "Stack", value: "Next.js · TypeScript · Node · PostgreSQL" },
          { label: "Also", value: "WordPress · WooCommerce · Three.js" },
          { label: "Based", value: "Sindhuli, Nepal · remote friendly" },
          { label: "Status", value: profile.status },
          { label: "Missions", value: `${projects.length} shipped case studies` },
        ].map((fact) => (
          <div key={fact.label}>
            <span className="panel-label">{fact.label}</span>
            <strong>{fact.value}</strong>
          </div>
        ))}
      </div>
      <p className="panel-note">
        Prefer a live tour? Undock with <kbd>Esc</kbd> and fly to any planet — the same information is
        mapped across the system.
      </p>
    </div>
  );
}

const PANELS: Record<SectionId, () => ReactElement> = {
  about: AboutPanel,
  skills: SkillsPanel,
  projects: ProjectsPanel,
  contact: ContactPanel,
  resume: ResumePanel,
};

export default function SectionContent({ id }: { id: SectionId }) {
  const Panel = PANELS[id];
  return <Panel />;
}
