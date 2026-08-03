export interface Project {
  slug: string;
  title: string;
  tag: string;
  repo: string;
  description: string;
  tech: string[];
  color: string;
  url: string | null;
  role: string;
  year: string;
  highlights: string[];
  process: string[];
  outcome: string;
}

export const projects: Project[] = [
  {
    slug: "ivote",
    title: "iVote — Secure Online Voting",
    tag: "Full-Stack",
    repo: "vote",
    description:
      "A university election platform with end-to-end encrypted voting using Paillier homomorphic encryption. Features face verification with blink-based liveness detection, full election lifecycle management, and automatic encrypted tally aggregation with private key erasure.",
    tech: ["Next.js", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Tailwind CSS"],
    color: "#4af0ff",
    url: "https://vote-teal.vercel.app",
    role: "Full-stack developer & security architecture",
    year: "2025",
    highlights: [
      "Paillier homomorphic encryption for end-to-end ballot privacy",
      "Blink-based liveness detection stops deepfake impersonation at the ballot box",
      "Private keys are erased automatically after tallying — votes become mathematically impossible to trace",
      "Runs the full election lifecycle: voter registration, voting window, encrypted tally, results",
    ],
    process: [
      "Audited the threat model first: impersonation, vote-buying, and tampered tallies were the three risks to kill.",
      "Chose Paillier because homomorphic addition lets the server tally without ever decrypting individual ballots.",
      "Built the voting UI in Next.js and the crypto core in Python/FastAPI to keep sensitive math isolated.",
      "Tied face verification + liveness into a single pre-vote gate so only a verified human can cast a ballot.",
    ],
    outcome:
      "A voting platform where neither the server, the admin, nor an attacker can reconstruct who voted for whom — only that the tally is correct.",
  },
  {
    slug: "pharma-connect",
    title: "Pharma Connect",
    tag: "Full-Stack",
    repo: "pharma_connect",
    description:
      "An application that connects patients to their nearest pharmacies. Making healthcare logistics accessible through a clean, modern interface built with TypeScript.",
    tech: ["TypeScript", "Next.js", "CSS"],
    color: "#ff6b35",
    url: "https://pharmaconnectnepal.vercel.app",
    role: "Developer",
    year: "2024",
    highlights: [
      "Location-aware pharmacy discovery so patients find the nearest open store",
      "Typed end-to-end with TypeScript — from API responses to UI state",
      "Designed for low-bandwidth users, common in rural Nepali towns",
    ],
    process: [
      "Started from the field: talked to pharmacy staff about what patients actually ask for.",
      "Prioritized a search that works with a phone number or location, not just a name.",
      "Kept the UI clean and fast, avoiding heavy assets for slow connections.",
    ],
    outcome:
      "A focused tool that shortens the gap between 'I need medicine' and 'the pharmacy that has it'.",
  },
  {
    slug: "automate",
    title: "Automate — Teacher Portfolios",
    tag: "Full-Stack",
    repo: "automate",
    description:
      "A platform enabling teachers to create personal portfolio websites with ease. Streamlined onboarding and customizable templates for educators to showcase their professional work.",
    tech: ["TypeScript", "Next.js", "CSS"],
    color: "#ffd700",
    url: null,
    role: "Developer",
    year: "2024",
    highlights: [
      "Template system that lets a teacher publish a portfolio in minutes, not days",
      "Streamlined onboarding that assumes zero technical background",
      "Reusable, maintainable component architecture across templates",
    ],
    process: [
      "Identified the real bottleneck: educators shouldn't need to learn web tooling to have a web presence.",
      "Designed the templates to be opinionated but customizable at a high level.",
      "Focused the editor on content, hiding the machinery behind the scenes.",
    ],
    outcome:
      "Teachers can go from signup to a published portfolio in a single sitting.",
  },
  {
    slug: "match-day-poster",
    title: "Match Day Poster",
    tag: "Full-Stack",
    repo: "Automated-Posts",
    description:
      "Real-time football match tracking application with live scores, automated Facebook posting, interactive score predictions, multi-league support, and team profiles with a glassmorphism UI.",
    tech: ["Python", "Flask", "JavaScript", "HTML", "CSS"],
    color: "#22c55e",
    url: null,
    role: "Developer",
    year: "2024",
    highlights: [
      "Automated match-day posters pushed straight to Facebook when the final whistle blows",
      "Interactive score predictions before kickoff",
      "Multi-league support with per-team profiles and a glassmorphism UI",
    ],
    process: [
      "Wired live match data into Flask and rendered match-day cards server-side.",
      "Added a Facebook automation step so results post without anyone touching the UI.",
      "Polished the visuals with a glassy, gradient-heavy aesthetic.",
    ],
    outcome:
      "A set-and-forget tracker: fans get live scores, predictions, and an auto-posted summary every matchday.",
  },
  {
    slug: "nico-paz",
    title: "Nico Paz WordPress Theme",
    tag: "WordPress",
    repo: "nico_paz",
    description:
      "Custom WordPress theme for Argentine footballer Nico Paz. TailwindCSS styling, WooCommerce integration, Polylang multi-language support, dark mode, and responsive bento grid gallery.",
    tech: ["PHP", "WordPress", "JavaScript", "Tailwind CSS", "WooCommerce"],
    color: "#ff4af0",
    url: null,
    role: "WordPress developer",
    year: "2025",
    highlights: [
      "Bento grid gallery that stays sharp from mobile to desktop",
      "Polylang multi-language support for Spanish + English audiences",
      "WooCommerce-ready for merchandise, with a polished dark mode",
    ],
    process: [
      "Studied how fan sites for players are consumed: mostly on phones, mostly on matchdays.",
      "Built the layout mobile-first, then layered in the bento grid and dark mode.",
      "Configured Polylang and WooCommerce so content and shop work in both languages.",
    ],
    outcome:
      "A theme that feels like the player's brand — fast on phones, bilingual, and store-ready.",
  },
  {
    slug: "himalayan-plugin",
    title: "Himalayan Plugin",
    tag: "WordPress",
    repo: "himalayan-plugin",
    description:
      "A WordPress plugin for technical audit fixes — streamlining common optimization, compliance, and maintenance tasks for WordPress sites with a clean admin interface.",
    tech: ["PHP", "WordPress", "JavaScript", "CSS"],
    color: "#8b5cf6",
    url: null,
    role: "WordPress plugin developer",
    year: "2025",
    highlights: [
      "Automates repetitive audit fixes that otherwise take hours across a fleet of sites",
      "Clean admin interface that non-technical site owners can navigate",
      "Covers optimization, compliance, and maintenance in one place",
    ],
    process: [
      "Catalogued the fixes I kept applying manually on client audits.",
      "Packaged each fix as a toggleable routine with safe defaults.",
      "Built the admin screen to read like a checklist, not a config panel.",
    ],
    outcome:
      "Audit remediation that used to take an afternoon now runs from a single screen.",
  },
];

export function getProject(slug: string): Project | null {
  return projects.find((p) => p.slug === slug) || null;
}
