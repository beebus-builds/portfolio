import Link from "next/link";
import type { Metadata } from "next";
import ProjectArchive from "@/components/site/ProjectArchive";
import SectionHeading from "@/components/site/SectionHeading";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { profile } from "@/lib/profile";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: `Projects — ${profile.name}`,
  description: `Eight shipped builds with the constraint that shaped each one and the outcome it produced: ${projects
    .map((project) => project.title)
    .join("; ")}.`,
};

export default function ProjectsPage() {
  return (
    <SitePage
      hero={
        <PageHero
          kicker="03 / Archive — Oberon"
          title="Eight missions, fully logged"
          lede="Each build below carries the constraint that shaped it and the outcome it produced. Open any mission for highlights, process, and proof."
          meta={[`${projects.length} case studies`, "Full-stack · WordPress", "2024 — 2025"]}
        />
      }
    >
      <section className="site-section" aria-label="All projects">
        <SectionHeading
          kicker="The archive"
          title="Every mission, one page each"
          lede="Search the stack or filter by type, then open the case study that matches what you need built."
        />
        <ProjectArchive />
      </section>

      <section className="site-section" aria-label="Keep reading">
        <div className="flight-teaser">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="section-head__kicker">Next</p>
            <h2 className="section-head__title">Like what you see?</h2>
            <p className="section-head__lede">
              The best collaborations start as one clear question — send yours over an open
              channel.
            </p>
          </div>
          <div className="site-hero__actions" style={{ marginBottom: 0 }}>
            <Link className="btn" href="/contact">
              Start a project →
            </Link>
            <Link className="btn btn--ghost" href="/resume">
              Check the record
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
