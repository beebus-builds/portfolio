import { anchorId } from "@/lib/anchors";
import { experience } from "@/lib/experience";
import { profile, skills } from "@/lib/profile";
import { projects } from "@/lib/projects";
import { sitePages, type PageSlug } from "@/lib/sitePages";

/**
 * What each portfolio page looks like as a 3D room. Pure data: the scene
 * component decides how to draw a layout, this decides what goes in it.
 */

export type WorldLayout = "peaks" | "gallery" | "pillars" | "road" | "orbit" | "papers" | "mail";

export type WorldItem = {
  /** Big label on the object. */
  label: string;
  /** Smaller second line. */
  sub?: string;
  /** 0–1, used for heights and sizes. */
  value?: number;
  color: string;
  /** DOM id to scroll to when the object is clicked. */
  target: string;
  /** Page sections that light this object up while they are being read. */
  sections: string[];
};

export type World = {
  slug: PageSlug;
  layout: WorldLayout;
  accent: string;
  /** Short line shown on the centrepiece. */
  title: string;
  items: WorldItem[];
};

export { anchorId };

const GROUP_COLORS: Record<string, string> = {
  Systems: "#7fe3ff",
  Interface: "#a78bfa",
  Platform: "#ffb86b",
  Craft: "#f472b6",
};

const PALETTE = ["#7fe3ff", "#a78bfa", "#ffb86b", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#fb7185"];

function sectionItems(slug: PageSlug, accent: string): WorldItem[] {
  return sitePages[slug].sections.map((section, index) => ({
    label: section.title,
    sub: `${String(index + 1).padStart(2, "0")} · ${section.kicker}`,
    color: index === 0 ? accent : PALETTE[index % PALETTE.length]!,
    target: section.id,
    sections: [section.id],
  }));
}

/** Project case-study sections, in the order the projects are listed. */
const PROJECT_SECTIONS = ["ivote", "pharma-connect"];

export function worldFor(slug: PageSlug): World | null {
  switch (slug) {
    case "about":
      return {
        slug,
        layout: "peaks",
        accent: "#7fe3ff",
        title: profile.name,
        items: (["Systems", "Interface", "Platform", "Craft"] as const).map((group) => ({
          label: group,
          sub: `${skills.filter((s) => s.group === group).length} capabilities`,
          color: GROUP_COLORS[group]!,
          target: "practice",
          sections: ["practice", "toolbox"],
        })),
      };
    case "projects":
      return {
        slug,
        layout: "gallery",
        accent: "#67e8f9",
        title: "Shipped work",
        items: projects.map((project, index) => ({
          label: project.title,
          sub: `${project.tag} · ${project.year}`,
          color: project.color || PALETTE[index % PALETTE.length]!,
          target: PROJECT_SECTIONS[index] ?? anchorId(project.title),
          sections: ["all-projects", ...(PROJECT_SECTIONS[index] ? [PROJECT_SECTIONS[index]!] : [])],
        })),
      };
    case "skills":
      return {
        slug,
        layout: "pillars",
        accent: "#a78bfa",
        title: "Capabilities",
        items: skills.map((skill) => ({
          label: skill.name,
          sub: `${skill.level}%`,
          value: skill.level / 100,
          color: GROUP_COLORS[skill.group] ?? "#7fe3ff",
          target: anchorId(skill.name),
          sections: ["capabilities", skill.group.toLowerCase()],
        })),
      };
    case "experience":
      return {
        slug,
        layout: "road",
        accent: "#ffd27a",
        title: "The path so far",
        items: experience.map((role, index) => ({
          label: role.role,
          sub: `${role.company} · ${role.period}`,
          color: PALETTE[(index + 2) % PALETTE.length]!,
          target: anchorId(`${role.role} — ${role.company}`),
          sections: ["path"],
        })),
      };
    case "services":
      return {
        slug,
        layout: "orbit",
        accent: "#f472b6",
        title: "How I can help",
        items: ["full-stack", "interface", "wordpress", "interactive", "audit"].flatMap((id, index) => {
          const section = sitePages.services.sections.find((s) => s.id === id);
          return section
            ? [{ label: section.title, sub: section.kicker, color: PALETTE[index]!, target: id, sections: [id] }]
            : [];
        }),
      };
    case "resume":
      return { slug, layout: "papers", accent: "#94a3b8", title: "The record", items: sectionItems(slug, "#e2e8f0") };
    case "contact":
      return {
        slug,
        layout: "mail",
        accent: "#fb7185",
        title: "Say hello",
        items: profile.links.map((link, index) => ({
          label: link.label,
          sub: link.value,
          color: PALETTE[(index * 3) % PALETTE.length]!,
          target: "direct-lines",
          sections: ["direct-lines", "signal-form"],
        })),
      };
    default:
      return null;
  }
}
