import SpaceExperience from "@/components/space/SpaceExperience";
import { planets, profile, skills } from "@/lib/profile";
import { projects, repoUrl } from "@/lib/projects";

export default function Home() {
  return (
    <>
      <SpaceExperience />

      {/*
        Server-rendered mirror of everything the 3D scene shows. This is the
        real site without JS, the readable target for the skip-link, and the
        document crawlers and link previews index.
      */}
      <div className="index" id="document" tabIndex={-1}>
        <a className="index__close" href="#document-closed">
          ← Back to the flight
        </a>

        <h1>
          {profile.name} — {profile.role}
        </h1>
        <p>
          {profile.intro} Based in {profile.location} ({profile.timezone}). {profile.status}.
        </p>

        {profile.bio.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}

        <h2>Contact</h2>
        <ul>
          {profile.links.map((link) => (
            <li key={link.label}>
              {link.label}: <a href={link.href}>{link.value}</a> — {link.note}
            </li>
          ))}
        </ul>
        <p>
          Resume: <a href="/resume.pdf">resume.pdf</a>
        </p>

        <h2>Skills</h2>
        <ul>
          {skills.map((skill) => (
            <li key={skill.name}>
              {skill.name} ({skill.group}) — {skill.detail}, {skill.level}%
            </li>
          ))}
        </ul>

        <h2>Projects</h2>
        <ul>
          {projects.map((project) => (
            <li key={project.slug}>
              <b>
                {project.title} ({project.year}, {project.tag})
              </b>{" "}
              — {project.description} Role: {project.role}. Tech: {project.tech.join(", ")}.
              {project.url ? ` Live: ${project.url}` : ""} Source: {repoUrl(project)}. Highlights:{" "}
              {project.highlights.join(" ")} How it was built: {project.process.join(" ")} Outcome:{" "}
              {project.outcome}
            </li>
          ))}
        </ul>

        <h2>Sections</h2>
        <ul>
          {planets.map((planet) => (
            <li key={planet.id}>
              {planet.label} — {planet.title}: {planet.blurb} {planet.readout}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
