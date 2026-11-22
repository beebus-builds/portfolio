import { experience } from "@/lib/experience";
import { achievements } from "@/lib/medals";
import { profile, skills, techStack } from "@/lib/profile";
import { projects } from "@/lib/projects";

/** Shared shapes for the classic pages. See components/site/PageBlocks.tsx. */
export type Block =
  | { kind: "prose"; paragraphs: string[] }
  | { kind: "cards"; items: { kicker?: string; title: string; body: string; meta?: string; tags?: string[]; href?: string }[] }
  | { kind: "facts"; items: { label: string; value: string }[] }
  | { kind: "timeline"; items: { when: string; title: string; body: string; points?: string[] }[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "steps"; items: { title: string; body: string }[] }
  | { kind: "quote"; text: string; by: string }
  | { kind: "faq"; items: { q: string; a: string }[] }
  | { kind: "metrics"; items: { value: string; label: string; note?: string }[] }
  | { kind: "links"; items: { label: string; value: string; href: string; note: string }[] }
  | { kind: "chips"; items: string[] }
  | { kind: "form" };

export type PageSection = { id: string; kicker: string; title: string; lede?: string; blocks: Block[] };
export type PageContent = {
  kicker: string;
  title: string;
  lede: string;
  meta: string[];
  sections: PageSection[];
  end: { title: string; body: string; primary: { href: string; label: string }; secondary: { href: string; label: string } };
};

export type PageSlug = "about" | "skills" | "projects" | "contact" | "resume" | "experience" | "stats" | "services";

const skillCards = skills.map((skill) => ({
  kicker: skill.group,
  title: skill.name,
  body: skill.detail,
  meta: `${skill.level}% proficiency`,
}));

const projectCards = projects.map((project) => ({
  kicker: `${project.tag} · ${project.year}`,
  title: project.title,
  body: project.description,
  meta: project.role,
  tags: project.tech.slice(0, 5),
  ...(project.url ? { href: project.url } : {}),
}));

const roleTimeline = experience.map((role) => ({
  when: role.period,
  title: `${role.role} — ${role.company}`,
  body: role.location,
  points: role.points,
}));

const skillGroupNames = ["Systems", "Interface", "Platform", "Craft"] as const;
const skillGroupDetails: Record<(typeof skillGroupNames)[number], string> = {
  Systems: "The unglamorous half: typed APIs, schemas, caching and failure paths that still hold up on a bad day.",
  Interface: "Pixels with intent — accessible components, considered motion, and layouts that survive a phone screen.",
  Platform: "Deployment, databases and the plumbing between them. If it only works on my machine, it is not finished.",
  Craft: "The last ten percent: prototype, sharpen, delete the clever bit that nobody needed.",
};

const contactLinks = profile.links.map((link) => ({
  label: link.label,
  value: link.value,
  href: link.href,
  note: link.note,
}));

export const sitePages: Record<PageSlug, PageContent> = {
  about: {
    kicker: "01 / ORIGIN",
    title: "About",
    lede: "A short, honest account of who is behind the desk and what goes into the work.",
    meta: [profile.name, profile.role, profile.location],
    sections: [
      {
        id: "origin",
        kicker: "Origin",
        title: "Who sits at this desk",
        blocks: [{ kind: "prose", paragraphs: profile.bio }],
      },
      {
        id: "practice",
        kicker: "Practice",
        title: "What I actually do",
        lede: "Four overlapping jobs, one brain.",
        blocks: [
          {
            kind: "cards",
            items: skillGroupNames.map((group) => ({
              kicker: group,
              title: `${group} engineering`,
              body: skillGroupDetails[group],
              meta: `${skills.filter((s) => s.group === group).length} capabilities`,
            })),
          },
        ],
      },
      {
        id: "flight",
        kicker: "The studio",
        title: "Why the homepage is a studio",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "The homepage is not a brochure — it is a place. You drop into my studio while I am coding, the music changes as the day goes on, and you get around by typing a command or taking me up on an offer to show you something. It is a slightly ridiculous idea, but it makes the portfolio memorable and it forces every piece of content to earn its place.",
              "These classic pages are the quiet alternative. Same person, same work, no heavy 3D runtime required. Pick whichever suits the mood you are in.",
            ],
          },
        ],
      },
      {
        id: "working-style",
        kicker: "Working style",
        title: "How I like to work",
        blocks: [
          {
            kind: "bullets",
            items: [
              "Ask the awkward question early — the one that changes what needs building.",
              "Ship something small and real before polishing the grand plan.",
              "Keep the data model honest; most bugs are a confused shape, not a confused screen.",
              "Measure the thing users feel, not the thing that is easiest to count.",
              "Leave the repo cleaner than I found it, with tests where they matter.",
            ],
          },
        ],
      },
      {
        id: "place",
        kicker: "Place",
        title: "Where I work from",
        blocks: [
          {
            kind: "facts",
            items: [
              { label: "Based in", value: profile.location },
              { label: "Coordinates", value: profile.coordinates },
              { label: "Timezone", value: profile.timezone },
              { label: "Status", value: profile.status },
            ],
          },
        ],
      },
      {
        id: "toolbox",
        kicker: "Toolbox",
        title: "The tools I reach for",
        blocks: [
          { kind: "chips", items: techStack },
          {
            kind: "prose",
            paragraphs: [
              "Tools change; the habit does not. I try to understand the layer below the one I am coding — the query plan under the endpoint, the layout pass under the animation — because that is where the interesting fixes live.",
            ],
          },
        ],
      },
      {
        id: "path",
        kicker: "Path",
        title: "How I got here",
        blocks: [{ kind: "timeline", items: roleTimeline }],
      },
      {
        id: "values",
        kicker: "Values",
        title: "What I care about",
        blocks: [
          {
            kind: "cards",
            items: [
              { title: "Clarity over cleverness", body: "The best abstraction is usually the one the next person can read in one sitting." },
              { title: "Craft at the edges", body: "Empty states, error messages and the 300ms after a click are part of the product." },
              { title: "Honest constraints", body: "I would rather say what is slow or unfinished than hide it behind a demo." },
              { title: "Small teams, big ownership", body: "The places where one developer has to mean a full department are where I do my best work." },
            ],
          },
        ],
      },
      {
        id: "questions",
        kicker: "Questions",
        title: "Things people ask",
        blocks: [
          {
            kind: "faq",
            items: [
              { q: "Are you available for work?", a: `Yes — ${profile.status.toLowerCase()}. Send a note and I will get back to you ${profile.responseWindow.toLowerCase()}.` },
              { q: "Do you only work with React?", a: "No. React and Next.js are where I spend most time, but the same care applies to PHP, WordPress, plain TypeScript and the database underneath." },
              { q: "Can you work with our timezone?", a: `I am based at ${profile.timezone}. Overlap is handled by writing things down and keeping the handoffs clear.` },
              { q: "Is the 3D studio really necessary?", a: "No, and that is the point. There is a whole text-based site behind it for anyone who would rather just read." },
            ],
          },
        ],
      },
      {
        id: "say-hello",
        kicker: "Contact",
        title: "Start a conversation",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["If any of this sounds useful, the inbox is open. Tell me what you are trying to build and what is in the way."],
          },
        ],
      },
    ],
    end: {
      title: "Take the next step",
      body: "Read about how I work, or go straight to the contact form.",
      primary: { href: "/contact", label: "Get in touch" },
      secondary: { href: "/skills", label: "See the skills" },
    },
  },

  skills: {
    kicker: "02 / CAPABILITY",
    title: "Skills",
    lede: "What I can do, how well I do it, and where the edges of the map are.",
    meta: [`${skills.length} capabilities`, "4 disciplines", "Honest percentages"],
    sections: [
      {
        id: "overview",
        kicker: "Overview",
        title: "Capability at a glance",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "These numbers are a rough map, not a scoreboard. They describe how independently I can work in an area — from following a pattern, through shipping it alone, to being the person others ask when it breaks.",
            ],
          },
        ],
      },
      {
        id: "capabilities",
        kicker: "Capabilities",
        title: "The full list",
        blocks: [{ kind: "cards", items: skillCards }],
      },
      ...skillGroupNames.map<PageSection>((group) => ({
        id: group.toLowerCase(),
        kicker: group,
        title: `${group} discipline`,
        lede: skillGroupDetails[group],
        blocks: [
          { kind: "bullets", items: skills.filter((s) => s.group === group).map((s) => `${s.name} — ${s.detail}`) },
        ],
      })),
      {
        id: "stack",
        kicker: "Stack",
        title: "Tools in rotation",
        blocks: [
          { kind: "chips", items: techStack },
          {
            kind: "prose",
            paragraphs: ["The stack is a consequence of the problem, not a religion. I pick the boring option when it is genuinely better and the interesting one when it buys something real."],
          },
        ],
      },
      {
        id: "testing",
        kicker: "Reliability",
        title: "Testing and reliability",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "A feature is done when the happy path works, the error path is understandable, and the regression has a test. This portfolio ships with typechecking, lint, unit tests and a production build on every push — the same gate I put on client work.",
            ],
          },
        ],
      },
      {
        id: "learning",
        kicker: "Learning",
        title: "How I stay current",
        blocks: [
          {
            kind: "bullets",
            items: [
              "Read the release notes before the blog posts about the release.",
              "Rebuild small things from scratch when a concept stops making sense.",
              "Write down what broke and why — the notes become the next debugging shortcut.",
              "Teach a junior developer the same topic; nothing exposes gaps faster.",
            ],
          },
        ],
      },
      {
        id: "apply",
        kicker: "Apply",
        title: "Put the skills to work",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["Skills are interesting mainly as a promise about future work. Here is what that promise looks like in practice."],
          },
        ],
      },
    ],
    end: {
      title: "See the evidence",
      body: "The projects page walks through the work behind these claims.",
      primary: { href: "/projects", label: "Browse projects" },
      secondary: { href: "/resume", label: "View the resume" },
    },
  },

  projects: {
    kicker: "03 / WORK",
    title: "Projects",
    lede: "Things that shipped, with the reasoning and the rough edges left in.",
    meta: [`${projects.length} projects`, "2024 — 2025", "End-to-end ownership"],
    sections: [
      {
        id: "selected-work",
        kicker: "Selected work",
        title: "The short version",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "Every project here had a real user, a real deployment and a real constraint — a deadline, an insecure default, a slow connection. The details below are what I would want to know if I were reading someone else's portfolio.",
            ],
          },
        ],
      },
      {
        id: "all-projects",
        kicker: "Catalogue",
        title: "Every project",
        blocks: [{ kind: "cards", items: projectCards }],
      },
      {
        id: "ivote",
        kicker: "Case study",
        title: "iVote — privacy as the requirement",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              projects[0]?.description ?? "",
              "The cryptography was the easy part to specify and the hard part to trust. The design keeps raw ballots unreadable to the server, erases the private key after tallying, and treats liveness detection as a gate rather than a decoration.",
            ],
          },
          { kind: "bullets", items: projects[0]?.highlights ?? [] },
          { kind: "quote", text: projects[0]?.outcome ?? "", by: "Project outcome" },
        ],
      },
      {
        id: "pharma-connect",
        kicker: "Case study",
        title: "Pharma Connect — logistics for real streets",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              projects[1]?.description ?? "",
              "The constraint was bandwidth and hardware, not visual flair. The interface stays light, the types stay honest, and the discovery flow works on the phones people actually carry.",
            ],
          },
          { kind: "bullets", items: projects[1]?.highlights ?? [] },
        ],
      },
      {
        id: "pattern",
        kicker: "Pattern",
        title: "What the projects share",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "Different stacks, same approach: understand the risk before writing the feature, keep the sensitive logic in a small place, and ship the smallest version that proves the idea. The rest is polish, and polish is cheaper once the shape is right.",
            ],
          },
        ],
      },
      {
        id: "security",
        kicker: "Security",
        title: "Security and privacy by default",
        blocks: [
          {
            kind: "bullets",
            items: [
              "Threat model first: list what an attacker wants, then design those paths out.",
              "Keep secrets out of the browser and out of the repository — no exceptions.",
              "Validate on the server even when the interface already checks.",
              "Prefer deletion over retention when a key or a record has done its job.",
            ],
          },
        ],
      },
      {
        id: "performance",
        kicker: "Performance",
        title: "Speed is a feature",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "The portfolio itself is a useful stress test: a real-time 3D studio, a synthesised soundtrack, a database and a chat layer all have to stay smooth on an ordinary laptop. That pressure produced the deferred scene loading, the procedural audio scheduler and the update rhythm that keeps the scene responsive without hammering the database.",
            ],
          },
        ],
      },
      {
        id: "process",
        kicker: "Process",
        title: "How a build goes",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Frame the problem", body: "Write down the user, the constraint and the thing that would make the project a failure." },
              { title: "Sketch the shape", body: "Data model and main flows first. Screens come after the shape makes sense." },
              { title: "Build the thin path", body: "One complete journey from input to stored result, deployed early." },
              { title: "Harden and document", body: "Error states, tests, accessibility and a short README someone else can follow." },
            ],
          },
        ],
      },
      {
        id: "outcomes",
        kicker: "Outcomes",
        title: "What came out of it",
        blocks: [
          {
            kind: "metrics",
            items: projects.slice(0, 4).map((project) => ({ value: project.year, label: project.title.split(" —")[0] ?? project.title, note: project.tag })),
          },
        ],
      },
      {
        id: "next-project",
        kicker: "Next",
        title: "The next one could be yours",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["I take on a small number of projects at a time so each one gets the attention it needs. If there is something you have been putting off, describe it to me."],
          },
        ],
      },
    ],
    end: {
      title: "Have a problem in mind?",
      body: "Send the messy version. I am interested in the constraint, not a polished brief.",
      primary: { href: "/contact", label: "Describe the project" },
      secondary: { href: "/services", label: "See what I offer" },
    },
  },

  contact: {
    kicker: "04 / CONTACT",
    title: "Contact",
    lede: "The inbox is open. Tell me what you are building and what is getting in the way.",
    meta: [profile.responseWindow, "No forms to mailing lists", profile.status],
    sections: [
      {
        id: "open-channel",
        kicker: "Open inbox",
        title: "Say hello",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "I read every message that comes through here. A few sentences about the problem, the timeline and the stack is plenty — I will ask the rest of the questions.",
            ],
          },
        ],
      },
      {
        id: "signal-form",
        kicker: "Contact form",
        title: "Send a message",
        blocks: [{ kind: "form" }],
      },
      {
        id: "direct-lines",
        kicker: "Direct lines",
        title: "Other ways through",
        blocks: [{ kind: "links", items: contactLinks }],
      },
      {
        id: "response",
        kicker: "Response",
        title: "What happens next",
        blocks: [
          {
            kind: "facts",
            items: [
              { label: "Reply window", value: profile.responseWindow },
              { label: "First step", value: "A short call or a written reply — your preference" },
              { label: "Languages", value: "English and Nepali" },
              { label: "Timezone", value: profile.timezone },
            ],
          },
        ],
      },
      {
        id: "good-fit",
        kicker: "Good fit",
        title: "Where I help most",
        blocks: [
          {
            kind: "bullets",
            items: [
              "A product that needs a full-stack developer from first commit to deployment.",
              "An existing site that needs performance, structure or accessibility work.",
              "A WordPress or PHP system that needs a careful hand rather than a fresh rewrite.",
              "A small team that needs someone to own the awkward parts end to end.",
            ],
          },
        ],
      },
      {
        id: "not-fit",
        kicker: "Boundaries",
        title: "Where I am less useful",
        blocks: [
          {
            kind: "bullets",
            items: [
              "Projects whose only requirement is a pixel-perfect copy of someone else's site.",
              "Work that cannot be discussed at all — I need enough context to solve the right problem.",
              "Ongoing maintenance with no owner on your side to make the small decisions.",
            ],
          },
        ],
      },
      {
        id: "include",
        kicker: "Prepare",
        title: "What to include",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "The goal", body: "What should be true when this is done?" },
              { title: "The constraint", body: "Deadline, budget ceiling, existing stack, or a hard technical limit." },
              { title: "The current state", body: "A link, a description or a screenshot — rough is fine." },
            ],
          },
        ],
      },
      {
        id: "together",
        kicker: "Working together",
        title: "How the first week goes",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "We agree on one narrow outcome and how we will know it arrived. I build the smallest useful version, put it in front of you early, and adjust from real feedback instead of a long list of assumptions.",
            ],
          },
        ],
      },
      {
        id: "faq",
        kicker: "FAQ",
        title: "Before you write",
        blocks: [
          {
            kind: "faq",
            items: [
              { q: "Do you take urgent work?", a: "Sometimes. Say what the deadline is and what is actually driving it — I will be straight about whether I can help." },
              { q: "Do you sign NDAs?", a: "Yes, for work that genuinely needs one. The earlier you mention it the easier it is for both sides." },
              { q: "Can you work with our existing team?", a: "Yes. Most of my work happens alongside other developers, designers and founders." },
              { q: "What if it is a small job?", a: "Describe it anyway. Small, well-defined jobs are often the best ones." },
            ],
          },
        ],
      },
      {
        id: "elsewhere",
        kicker: "Elsewhere",
        title: "Read more first",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["If you would rather look before writing, the logbook has long-form notes on the work and the resume has the short version."],
          },
        ],
      },
    ],
    end: {
      title: "The inbox is open",
      body: "No ceremony needed — a plain message is the best kind.",
      primary: { href: "mailto:poudelbibash044@gmail.com", label: "Email directly" },
      secondary: { href: "/resume", label: "Read the resume" },
    },
  },

  resume: {
    kicker: "05 / RECORD",
    title: "Resume",
    lede: "The printed record: roles, education, skills and the work worth naming.",
    meta: [profile.name, profile.role, profile.location],
    sections: [
      {
        id: "record",
        kicker: "Record",
        title: "The short version",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "A developer working across the stack from Sindhuli, Nepal. Next.js and TypeScript day to day, with a long history of WordPress, PHP and the kind of backend work nobody sees until it fails.",
              "There is also a printable version of this record if you need something to hand to another human.",
            ],
          },
          {
            kind: "links",
            items: [{ label: "Print", value: "Download résumé (PDF)", href: "/resume.pdf", note: "A one-page version for printing and attachments" }],
          },
        ],
      },
      {
        id: "identity",
        kicker: "Identity",
        title: "Details",
        blocks: [
          {
            kind: "facts",
            items: [
              { label: "Name", value: profile.name },
              { label: "Role", value: profile.role },
              { label: "Location", value: profile.location },
              { label: "Status", value: profile.status },
              { label: "Timezone", value: profile.timezone },
            ],
          },
        ],
      },
      {
        id: "employment",
        kicker: "Employment",
        title: "Roles and periods",
        blocks: [{ kind: "timeline", items: roleTimeline }],
      },
      {
        id: "education",
        kicker: "Education",
        title: "Education",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "BSc Computing at university in Kathmandu, with the useful part being the habit of turning coursework into deployed projects. Club work and mentoring filled the gaps between the syllabus and production.",
            ],
          },
          {
            kind: "facts",
            items: [
              { label: "Degree", value: "BSc Computing" },
              { label: "Period", value: "2022 — 2026" },
              { label: "Location", value: "Kathmandu, Nepal" },
              { label: "Focus", value: "Web systems, data structures, software practice" },
            ],
          },
        ],
      },
      {
        id: "core-skills",
        kicker: "Core skills",
        title: "Strongest areas",
        blocks: [{ kind: "cards", items: skillCards.slice(0, 6) }],
      },
      {
        id: "selected-projects",
        kicker: "Selected projects",
        title: "Work worth naming",
        blocks: [{ kind: "cards", items: projectCards.slice(0, 4) }],
      },
      {
        id: "learning-history",
        kicker: "Learning",
        title: "Continuous learning",
        blocks: [
          {
            kind: "bullets",
            items: [
              "Self-directed study in distributed systems, cryptography and interaction design.",
              "Release notes and source code before summaries — the details are usually in the source.",
              "Teaching juniors as a way to keep the basics sharp.",
              "Writing architecture notes for every non-trivial system I ship.",
            ],
          },
        ],
      },
      {
        id: "medals",
        kicker: "Extras",
        title: "Site milestones",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["Even the portfolio has a scoreboard. These milestones are earned by exploring the site — a small reminder that the site is meant to be played with."],
          },
          { kind: "chips", items: achievements.map((achievement) => achievement.title) },
        ],
      },
      {
        id: "references",
        kicker: "References",
        title: "References",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["References are available on request. If you have worked with me and would like to say a few words, I would be glad to hear it."],
          },
        ],
      },
      {
        id: "contact-details",
        kicker: "Contact",
        title: "Reach me",
        blocks: [{ kind: "links", items: contactLinks }],
      },
    ],
    end: {
      title: "Need the full story?",
      body: "The experience page goes deeper into what each role actually involved.",
      primary: { href: "/experience", label: "Read the experience" },
      secondary: { href: "/contact", label: "Get in touch" },
    },
  },

  experience: {
    kicker: "06 / HISTORY",
    title: "Experience",
    lede: "The path from a custom WordPress theme to full-stack systems and a studio you can step into.",
    meta: ["2020 — Present", `${experience.length} chapters`, "Remote-friendly"],
    sections: [
      {
        id: "path",
        kicker: "Path",
        title: "The path so far",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "I did not start with a computer science degree and a clean plan. I started with a local business that needed a website, a text editor and a lot of stubbornness. Each step came from a real problem that needed solving.",
            ],
          },
        ],
      },
      {
        id: "timeline",
        kicker: "Timeline",
        title: "Roles in order",
        blocks: [{ kind: "timeline", items: roleTimeline }],
      },
      {
        id: "independent",
        kicker: "Now",
        title: "Working independently",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "Today I own products end to end: the conversation that defines them, the interface people touch, the API behind it, the schema underneath and the deployment that keeps it all alive. Small teams are where this works best — fewer handoffs, more ownership, clearer responsibility for the result.",
            ],
          },
        ],
      },
      {
        id: "university",
        kicker: "University",
        title: "Campus as a workshop",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "University gave me the theory, but the campus tools club gave me the practice. iVote started there as a question about whether an election could actually be private, and turned into a system with homomorphic tallying and liveness checks.",
            ],
          },
        ],
      },
      {
        id: "early-web",
        kicker: "Early web",
        title: "Where it started",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "WordPress and PHP were my first real programming environment. Custom themes, plugins and the occasional broken site taught me performance, SEO and accessibility in the order that production tends to teach them: by breaking something first.",
            ],
          },
        ],
      },
      {
        id: "lessons",
        kicker: "Lessons",
        title: "What each chapter taught me",
        blocks: [
          {
            kind: "cards",
            items: experience.map((role, index) => ({
              kicker: `Chapter ${index + 1}`,
              title: role.company,
              body: role.points[0] ?? "",
              meta: role.period,
            })),
          },
        ],
      },
      {
        id: "teams",
        kicker: "Teams",
        title: "Working with other people",
        blocks: [
          {
            kind: "bullets",
            items: [
              "Write the decision down — a short note beats a long meeting six months later.",
              "Ask designers about the states nobody drew: empty, loading, broken, slow.",
              "Review the schema like it is a public interface, because it is.",
              "Mentoring is not a detour from the work; it raises the whole team's floor.",
            ],
          },
        ],
      },
      {
        id: "measured",
        kicker: "Measured",
        title: "The visible record",
        blocks: [
          {
            kind: "metrics",
            items: [
              { value: `${projects.length}`, label: "Shipped projects", note: "Catalogued with process and outcome" },
              { value: `${skills.length}`, label: "Documented capabilities", note: "Across four disciplines" },
              { value: "24/7", label: "Remote availability", note: `Based at ${profile.timezone}` },
            ],
          },
        ],
      },
      {
        id: "reflection",
        kicker: "Reflection",
        title: "Questions worth asking",
        blocks: [
          {
            kind: "faq",
            items: [
              { q: "Would I do it the same way again?", a: "Mostly. I would have learned to ask about the business problem earlier — the technical problem is often a symptom." },
              { q: "What changed the most?", a: "The move from building screens to owning systems. Once you own the data path, the interface questions get easier." },
              { q: "What am I looking for now?", a: "Work with real constraints and people who care about the details. The size of the company matters less than the honesty of the team." },
            ],
          },
        ],
      },
      {
        id: "next-chapter",
        kicker: "Next",
        title: "The next chapter",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["The next role or project should be a step up in responsibility, not just a change of stack. If that sounds like what you are building, let's talk."],
          },
        ],
      },
    ],
    end: {
      title: "Continue the story",
      body: "The resume condenses it; the projects show the output.",
      primary: { href: "/resume", label: "View resume" },
      secondary: { href: "/projects", label: "Browse projects" },
    },
  },

  stats: {
    kicker: "07 / TELEMETRY",
    title: "Stats",
    lede: "Live site telemetry — visitors, pages explored, milestones and messages.",
    meta: ["Live from the database", "Refreshed on load", "Anonymous by design"],
    sections: [
      {
        id: "telemetry",
        kicker: "Telemetry",
        title: "What this page measures",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "These numbers come from the same database that powers the site. They describe what visitors do on the site — arriving, exploring pages and sending a message — not anything about who they are.",
            ],
          },
        ],
      },
      {
        id: "visitors",
        kicker: "Visitors",
        title: "People who visited",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["Every visitor gets an anonymous cookie so progress can survive a reload. No name, no account, no tracking across other sites."],
          },
        ],
      },
      {
        id: "worlds",
        kicker: "Districts",
        title: "Districts explored",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["Five districts carry the main sections of the portfolio. Each visit is counted once per visitor, so repeat visits do not inflate the total."],
          },
        ],
      },
      {
        id: "medals",
        kicker: "Medals",
        title: "Achievements unlocked",
        blocks: [
          { kind: "chips", items: achievements.map((achievement) => achievement.title) },
          {
            kind: "prose",
            paragraphs: ["The medals are small milestones baked into the site: first arrival, explore a page, visit every page, run the tour, and open the contact form."],
          },
        ],
      },
      {
        id: "leaderboard",
        kicker: "Leaderboard",
        title: "Which medals are common",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["The live ordering appears in the site dashboard. It is a curiosity, not a competition — there is nothing to win except a slightly warmer feeling about exploration."],
          },
        ],
      },
      {
        id: "signals",
        kicker: "Messages",
        title: "Messages received",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["Messages sent through the contact form are stored in the admin inbox. The count here is the total number of messages received, not their contents."],
          },
        ],
      },
      {
        id: "method",
        kicker: "Method",
        title: "How counting works",
        blocks: [
          {
            kind: "bullets",
            items: [
              "One anonymous identifier per browser, stored in a first-party cookie.",
              "Exploring a district awards a visit once; the same district visited again is not double counted.",
              "Counters are aggregated in Postgres and cached briefly at the API boundary.",
              "If the database is unavailable, the page falls back to zeroes rather than inventing numbers.",
            ],
          },
        ],
      },
      {
        id: "arcade",
        kicker: "Arcade",
        title: "High scores",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["The arcade mini-game keeps its own score list. It is deliberately separate from the progress counters — playing badly in an arcade game should not change your site statistics."],
          },
        ],
      },
      {
        id: "privacy",
        kicker: "Privacy",
        title: "What is not collected",
        blocks: [
          {
            kind: "bullets",
            items: [
              "No account, email or name is attached to site progress.",
              "No third-party analytics script runs on these pages.",
              "Chat lines in Cheer Park are stored only to deliver the chat and are pruned as the log grows.",
            ],
          },
        ],
      },
      {
        id: "live",
        kicker: "Live",
        title: "See it happen",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["The numbers at the top of this page are fetched when it loads. Explore a district or send a message, then come back — the readout will have moved."],
          },
        ],
      },
    ],
    end: {
      title: "Add to the numbers",
      body: "Explore a few pages from the studio. The counters update on the next page load.",
      primary: { href: "/", label: "Back to the studio" },
      secondary: { href: "/contact", label: "Get in touch" },
    },
  },

  services: {
    kicker: "08 / OFFER",
    title: "Services",
    lede: "The kinds of work I take on, what you get, and how we get there.",
    meta: ["Full-stack builds", "Interface work", "Careful maintenance"],
    sections: [
      {
        id: "offer",
        kicker: "Offer",
        title: "What I do for clients",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "I work best where design, engineering and deployment meet. That usually means one person owning a product from the first conversation to the live URL, with clear handoffs when a team is involved.",
            ],
          },
        ],
      },
      {
        id: "full-stack",
        kicker: "Build",
        title: "Full-stack product builds",
        blocks: [
          {
            kind: "cards",
            items: [
              {
                kicker: "From zero",
                title: "New products",
                body: "Typed front end, API, database schema, authentication and deployment. Built in thin, testable slices so you see something working early.",
                tags: ["Next.js", "TypeScript", "Postgres", "Vercel"],
              },
              {
                kicker: "From existing",
                title: "Product extensions",
                body: "New features inside an established system, added without turning the codebase into a second job for your team.",
                tags: ["APIs", "Integrations", "Tests"],
              },
            ],
          },
        ],
      },
      {
        id: "interface",
        kicker: "Interface",
        title: "Interface engineering",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "Interfaces are where the product becomes real. I build accessible components, considered motion and layouts that hold up on a phone, with reduced-motion and keyboard paths included rather than bolted on.",
            ],
          },
        ],
      },
      {
        id: "wordpress",
        kicker: "Platform",
        title: "WordPress and PHP",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "Custom themes, plugins, WooCommerce and multilingual setups. Often the right answer is to repair and speed up what exists instead of throwing it away — especially when editors and content depend on it.",
            ],
          },
        ],
      },
      {
        id: "interactive",
        kicker: "Creative",
        title: "Interactive systems",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "Interactive systems for experiences that need presence rather than another scrolling page. This portfolio is the largest example: a hand-built 3D studio with an animated character, procedural lo-fi music and a keyboard-driven terminal — all built to stay smooth on an ordinary laptop.",
            ],
          },
        ],
      },
      {
        id: "audit",
        kicker: "Improve",
        title: "Performance and reliability audits",
        blocks: [
          {
            kind: "bullets",
            items: [
              "Find what actually slows the page down, with measurements rather than hunches.",
              "Untangle data paths and query patterns that grew without a plan.",
              "Add a test and build gate so the fix stays fixed.",
              "Leave a short written record of what changed and why.",
            ],
          },
        ],
      },
      {
        id: "engagement",
        kicker: "Engagement",
        title: "How an engagement runs",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Conversations", body: "We agree on the outcome, the constraint and what success looks like in one sentence." },
              { title: "Shape", body: "A short plan covering the data model, the main flows and the first deployable slice." },
              { title: "Build", body: "Regular working versions, not a single reveal at the end. Feedback lands while changes are cheap." },
              { title: "Handover", body: "Documentation, tests, deployment notes and a walkthrough of the parts that need care." },
            ],
          },
        ],
      },
      {
        id: "deliverables",
        kicker: "Deliverables",
        title: "What you receive",
        blocks: [
          {
            kind: "bullets",
            items: [
              "Source in your repository, with a readable history and no hidden dependencies.",
              "A production deployment you control, with environment variables documented.",
              "Tests around the behaviour that would hurt most if it broke.",
              "A short README explaining how to run, change and ship the project.",
            ],
          },
        ],
      },
      {
        id: "pricing",
        kicker: "Pricing",
        title: "How I price work",
        blocks: [
          {
            kind: "prose",
            paragraphs: [
              "Small, well-defined jobs are priced up front. Longer engagements are billed in agreed chunks with a visible scope, so neither side is surprised when the work grows. Tell me the constraint and I will tell you the shape of the number.",
            ],
          },
        ],
      },
      {
        id: "start",
        kicker: "Start",
        title: "Begin with a conversation",
        blocks: [
          {
            kind: "prose",
            paragraphs: ["You do not need a finished specification. A problem, a rough deadline and a link to the current state is enough to start."],
          },
        ],
      },
    ],
    end: {
      title: "Let's build something",
      body: "Describe the work and I will come back with an honest view of the approach.",
      primary: { href: "/contact", label: "Start a project" },
      secondary: { href: "/projects", label: "See past work" },
    },
  },
};
