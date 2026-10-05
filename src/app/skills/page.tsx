import Link from "next/link";
import type { Metadata } from "next";
import SectionContent from "@/components/space/SectionContent";
import SectionHeading from "@/components/site/SectionHeading";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { profile, skills } from "@/lib/profile";

export const metadata: Metadata = {
  title: `Skills — ${profile.name}`,
  description: `Eight skill clusters across systems, interface, platform and craft: ${skills
    .slice(0, 4)
    .map((skill) => skill.name)
    .join(", ")}, and more.`,
};

const READING = [
  {
    title: "Shipped, not certified",
    body: "Every percentage below is self-assessed against real delivery — launches, incidents, and maintenance — not quiz scores.",
  },
  {
    title: "T-shaped by necessity",
    body: "Deep in full-stack TypeScript and interfaces, broad enough across data, WordPress, and 3D to own a feature end to end.",
  },
  {
    title: "Details are the point",
    body: "Accessibility, empty states, and the last 10% of craft are scheduled work, not polish applied if time allows.",
  },
];

export default function SkillsPage() {
  return (
    <SitePage
      hero={
        <PageHero
          kicker="02 / Capability — Ferrovia"
          title="The instrument panel"
          lede="Eight clusters across systems, interface, platform, and craft. This page shows all of them — plus how to read the numbers honestly."
          meta={[
            `${skills.length} clusters`,
            "4 disciplines",
            "Self-assessed on delivery",
          ]}
        />
      }
    >
      <section className="site-section" aria-label="All skills">
        <div className="doc">
          <SectionContent id="skills" />
        </div>
      </section>

      <section className="site-section" aria-labelledby="skills-reading">
        <SectionHeading
          kicker="How to read this"
          title="What the bars actually mean"
          lede="A level 96 does not mean knowing everything — it means I have shipped it, broken it, and fixed it at 2am."
        />
        <ul className="site-grid" id="skills-reading">
          {READING.map((item, index) => (
            <li className="site-card" key={item.title}>
              <span className="site-card__kicker">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" aria-label="Keep reading">
        <div className="flight-teaser">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="section-head__kicker">Next</p>
            <h2 className="section-head__title">Proof, not promises</h2>
            <p className="section-head__lede">
              Every cluster above was earned on a mission in the archive — open any build for
              the full breakdown.
            </p>
          </div>
          <div className="site-hero__actions" style={{ marginBottom: 0 }}>
            <Link className="btn" href="/projects">
              Open the archive →
            </Link>
            <Link className="btn btn--ghost" href="/contact">
              Ask about a stack
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
