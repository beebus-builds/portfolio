export const profile = {
  name: "Bibash Poudel",
  role: "Creative developer",
  location: "Sindhuli, Nepal",
  coordinates: "27.7172° N / 85.4360° E",
  timezone: "UTC+05:45",
  status: "Open to work",
  intro:
    "This portfolio is my desk. Pull up a chair while I code, sip coffee and change the music — then type a command or let me show you around: who I am, what I can build, the work I shipped and how to reach me.",
  bio: [
    "I build digital systems that feel a little more human — interfaces with intent, backends that hold their weight, and the unglamorous plumbing that keeps both honest.",
    "I started in WordPress and PHP, learned to love the browser while chasing a single 300ms interaction, and never stopped caring about the last 10% of craft. Today I work across Next.js, TypeScript, and design systems.",
    "Based in Sindhuli, in the hills south of Kathmandu, working with teams everywhere. I like small teams, hard problems, and products where the details are the point.",
  ],
  links: [
    { label: "Email", value: "poudelbibash044@gmail.com", href: "mailto:poudelbibash044@gmail.com", note: "Best for professional inquiries" },
    { label: "GitHub", value: "/beebus-builds", href: "https://github.com/beebus-builds", note: "Code, experiments, side projects" },
    { label: "LinkedIn", value: "/in/bibashpoudel", href: "https://linkedin.com/in/bibashpoudel", note: "Work history and network" },
  ],
  responseWindow: "Usually within 24 hours",
};

export interface Skill {
  name: string;
  detail: string;
  level: number;
  group: "Systems" | "Interface" | "Platform" | "Craft";
}

export const skills: Skill[] = [
  { name: "Full-stack systems", detail: "Next.js · React · TypeScript · Node · REST & edge APIs", level: 96, group: "Systems" },
  { name: "Interface engineering", detail: "Tailwind · Framer Motion · design systems · accessibility", level: 93, group: "Interface" },
  { name: "Data & infrastructure", detail: "PostgreSQL · Neon · schema design · caching strategy", level: 88, group: "Systems" },
  { name: "3D & realtime", detail: "Three.js · React Three Fiber · WebGL shaders · physics", level: 85, group: "Interface" },
  { name: "WordPress engineering", detail: "PHP · WooCommerce · custom themes · plugins · Polylang", level: 90, group: "Platform" },
  { name: "Serverless & edge", detail: "Vercel · Cloudinary · Neon serverless · CI pipelines", level: 84, group: "Platform" },
  { name: "Creative direction", detail: "Concept · prototyping · interaction storytelling", level: 86, group: "Craft" },
  { name: "Technical writing", detail: "Docs · architecture notes · teaching what I build", level: 80, group: "Craft" },
  { name: "Motion & interaction", detail: "Framer Motion · scroll choreography · reduced-motion aware", level: 87, group: "Interface" },
  { name: "Testing & reliability", detail: "Vitest · Playwright · CI gating · honest uptime bars", level: 79, group: "Systems" },
];

/**
 * Concrete technologies, for structured data (JSON-LD `knowsAbout`) and any
 * place that needs a plain tech list. The capability entries above describe
 * how the stack is grouped; this is the flat enumeration.
 */
export const techStack = [
  "Next.js",
  "TypeScript",
  "React",
  "Node.js",
  "PostgreSQL",
  "WordPress",
  "PHP",
];
