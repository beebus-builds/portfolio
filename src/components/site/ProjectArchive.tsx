"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { projects, repoUrl } from "@/lib/projects";

const TAGS = ["All", ...Array.from(new Set(projects.map((project) => project.tag)))];

function matches(project: (typeof projects)[number], query: string): boolean {
  const haystack = [
    project.title,
    project.description,
    project.tag,
    project.role,
    project.year,
    project.outcome,
    ...project.tech,
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** Searchable, filterable mission archive for the projects page. */
export default function ProjectArchive() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");

  const filtered = useMemo(
    () =>
      projects.filter(
        (project) => (tag === "All" || project.tag === tag) && matches(project, query)
      ),
    [query, tag]
  );

  const reset = () => {
    setQuery("");
    setTag("All");
  };

  return (
    <div>
      <div className="archive-filter" role="search" aria-label="Filter projects">
        <label className="archive-search">
          <span className="sr-only">Search projects</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search missions, stacks, years…"
            aria-label="Search projects"
          />
        </label>
        <div className="archive-chips" role="group" aria-label="Filter by type">
          {TAGS.map((option) => (
            <button
              key={option}
              type="button"
              className="archive-chip"
              data-active={tag === option || undefined}
              aria-pressed={tag === option}
              onClick={() => setTag(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="archive-count" role="status">
        Showing {filtered.length} of {projects.length} missions
        {(query || tag !== "All") && (
          <>
            {" "}
            ·{" "}
            <button type="button" className="archive-reset" onClick={reset}>
              Reset ✕
            </button>
          </>
        )}
      </p>

      {filtered.length > 0 ? (
        <div className="project-list">
          {filtered.map((project) => (
            <article
              className="project-card"
              key={project.slug}
              id={project.slug}
              style={{ borderColor: `${project.color}44` }}
            >
              <div className="project-card__head">
                <span className="project-card__index">
                  {String(projects.indexOf(project) + 1).padStart(2, "0")}
                </span>
                <div>
                  <h4>{project.title}</h4>
                  <p>
                    {project.tag} · {project.year} · {project.role}
                  </p>
                </div>
              </div>
              <p className="project-card__description">{project.description}</p>
              <ul className="project-card__highlights">
                {project.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <div className="project-card__footer">
                <div className="project-card__tech">
                  {project.tech.slice(0, 4).map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
                <div className="project-card__actions">
                  <Link href={`/projects/${project.slug}`}>Case study →</Link>
                  <a href={repoUrl(project)} target="_blank" rel="noreferrer">
                    Source ↗
                  </a>
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${project.title} live`}
                    >
                      Live ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="archive-empty">
          <p>No missions match that search.</p>
          <button type="button" className="btn btn--small" onClick={reset}>
            Clear search & filters
          </button>
        </div>
      )}
    </div>
  );
}
