import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { profile } from "@/lib/profile";
import { projects, repoUrl } from "@/lib/projects";

type CaseStudyProps = {
  params: Promise<{ slug: string }>;
};

function findProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: CaseStudyProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) return { title: `Project — ${profile.name}` };
  return {
    title: `${project.title} — ${profile.name}`,
    description: `${project.description} Role: ${project.role}. Outcome: ${project.outcome}`,
  };
}

export default async function CaseStudyPage({ params }: CaseStudyProps) {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) notFound();

  const index = projects.findIndex((item) => item.slug === project.slug);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <SitePage
      hero={
        <PageHero
          kicker={`Mission ${String(index + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")} — ${project.tag}`}
          title={project.title}
          lede={project.description}
          meta={[project.year, project.role, `${project.tech.length} technologies`]}
        />
      }
    >
      <section className="site-section" aria-label="Case study">
        <div className="doc">
          <div className="panel-body">
            <p>
              <strong>Live links: </strong>
              <a href={repoUrl(project)} target="_blank" rel="noreferrer">
                Source ↗
              </a>
              {project.url && (
                <>
                  {" · "}
                  <a href={project.url} target="_blank" rel="noreferrer">
                    Live site ↗
                  </a>
                </>
              )}
            </p>

            <h3 className="section-head__title" style={{ fontSize: "22px" }}>
              Why it mattered
            </h3>
            <ul className="project-card__highlights">
              {project.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>

            <h3 className="section-head__title" style={{ fontSize: "22px" }}>
              How it was built
            </h3>
            <ol
              style={{
                display: "grid",
                gap: "12px",
                margin: 0,
                paddingLeft: "22px",
                color: "var(--muted)",
                fontSize: "14.5px",
                lineHeight: 1.7,
              }}
            >
              {project.process.map((step, stepIndex) => (
                <li key={step}>
                  <strong style={{ color: "var(--ink)" }}>Step {stepIndex + 1} — </strong>
                  {step}
                </li>
              ))}
            </ol>

            <h3 className="section-head__title" style={{ fontSize: "22px" }}>
              Outcome
            </h3>
            <p>{project.outcome}</p>

            <h3 className="section-head__title" style={{ fontSize: "22px" }}>
              Stack
            </h3>
            <ul className="site-card__tags" aria-label="Technologies">
              {project.tech.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </div>

          <nav className="pager" aria-label="More missions">
            <Link href={`/projects/${previous.slug}`}>
              <small>← Previous</small>
              <b>{previous.title}</b>
            </Link>
            <Link href={`/projects/${next.slug}`}>
              <small>Next →</small>
              <b>{next.title}</b>
            </Link>
          </nav>
        </div>
      </section>
    </SitePage>
  );
}
