export const profile = {
  name: "Bibash Poudel",
  callSign: "BP-07",
  craft: "Courier ship",
  role: "Creative developer",
  location: "Sindhuli, Nepal",
  coordinates: "27.7172° N / 85.4360° E",
  timezone: "UTC+05:45",
  status: "Open to work",
  intro:
    "You are flying my ship. Five planets hold everything I have: who I am, what I can build, the work I shipped, how to reach me, and the printed record of it all. Steer with the keys, click a planet to dock.",
  bio: [
    "I build digital systems that feel a little more human — interfaces with intent, backends that hold their weight, and the unglamorous plumbing that keeps both honest.",
    "I started in WordPress and PHP, learned to love the browser while chasing a single 300ms interaction, and never stopped caring about the last 10% of craft. Today I work across Next.js, TypeScript, and design systems.",
    "Based in Sindhuli, in the hills south of Kathmandu, working with teams everywhere. I like small teams, hard problems, and products where the details are the point.",
  ],
  links: [
    { label: "Email", value: "bibashpoudel@email.com", href: "mailto:bibashpoudel@email.com", note: "Best for professional inquiries" },
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
];

export type SectionId = "about" | "skills" | "projects" | "contact" | "resume";

export interface PlanetDef {
  id: SectionId;
  label: string;
  title: string;
  kicker: string;
  blurb: string;
  /** Body colour of the planet. */
  color: string;
  /** Banding / surface secondary colour. */
  bandColor: string;
  /** Atmosphere rim colour. */
  glowColor: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  orbitTilt: number;
  axialTilt: number;
  spinSpeed: number;
  ring: boolean;
  ringColor: string;
  moons: number;
  /** Flavour text shown in the docking panel. */
  readout: string;
}

export const planets: PlanetDef[] = [
  {
    id: "about",
    label: "ABOUT",
    title: "Verdania",
    kicker: "01 / ORIGIN",
    blurb: "Who is flying this ship, and why it exists.",
    color: "#4fb8ff",
    bandColor: "#0d3f6b",
    glowColor: "#8ad6ff",
    radius: 15,
    orbitRadius: 110,
    orbitSpeed: 0.062,
    orbitPhase: 0.4,
    orbitTilt: 0.06,
    axialTilt: 0.28,
    spinSpeed: 0.12,
    ring: false,
    ringColor: "#8ad6ff",
    moons: 2,
    readout: "Ocean world · 1 moon · 27.7172° N",
  },
  {
    id: "skills",
    label: "SKILLS",
    title: "Ferrovia",
    kicker: "02 / CAPABILITY",
    blurb: "The instrument panel: what I can actually build.",
    color: "#a78bfa",
    bandColor: "#3b1f6e",
    glowColor: "#c9b6ff",
    radius: 12,
    orbitRadius: 165,
    orbitSpeed: -0.047,
    orbitPhase: 2.1,
    orbitTilt: -0.12,
    axialTilt: 0.42,
    spinSpeed: 0.19,
    ring: true,
    ringColor: "#c9b6ff",
    moons: 1,
    readout: "Ringed giant · 0 moons · 8 instrument clusters",
  },
  {
    id: "projects",
    label: "PROJECTS",
    title: "Oberon",
    kicker: "03 / ARCHIVE",
    blurb: "Six worlds I pulled apart, rebuilt, and shipped.",
    color: "#ff9f45",
    bandColor: "#6b2f0d",
    glowColor: "#ffc48a",
    radius: 13.5,
    orbitRadius: 225,
    orbitSpeed: 0.036,
    orbitPhase: 4.05,
    orbitTilt: 0.1,
    axialTilt: 0.16,
    spinSpeed: 0.1,
    ring: true,
    ringColor: "#ffc48a",
    moons: 3,
    readout: "Desert giant · 2 moons · 6 logged missions",
  },
  {
    id: "contact",
    label: "CONTACT",
    title: "Halcyon",
    kicker: "04 / COMMS",
    blurb: "An open channel. Send a signal, get a reply.",
    color: "#34e5a1",
    bandColor: "#0b5039",
    glowColor: "#8dffd2",
    radius: 11,
    orbitRadius: 290,
    orbitSpeed: -0.027,
    orbitPhase: 5.4,
    orbitTilt: -0.08,
    axialTilt: 0.34,
    spinSpeed: 0.24,
    ring: true,
    ringColor: "#8dffd2",
    moons: 2,
    readout: "Signal relay · 1 moon · reply window 24h",
  },
  {
    id: "resume",
    label: "RESUME",
    title: "Cartograph",
    kicker: "05 / RECORD",
    blurb: "The printed flight log, one page, downloadable.",
    color: "#ff6b9d",
    bandColor: "#6d1136",
    glowColor: "#ffb3cb",
    radius: 9.5,
    orbitRadius: 360,
    orbitSpeed: 0.021,
    orbitPhase: 3.2,
    orbitTilt: 0.14,
    axialTilt: 0.2,
    spinSpeed: 0.16,
    ring: false,
    ringColor: "#ffb3cb",
    moons: 1,
    readout: "Archive moon · 0 moons · 1 page PDF",
  },
];

export function getPlanet(id: SectionId): PlanetDef {
  const found = planets.find((planet) => planet.id === id);
  if (!found) throw new Error(`Unknown planet: ${id}`);
  return found;
}

export const flightHelp = [
  { keys: "W / S", action: "Thrust ahead · brake" },
  { keys: "A / D", action: "Yaw left · right" },
  { keys: "↑ / ↓", action: "Climb · descend" },
  { keys: "Q / E", action: "Roll left · right" },
  { keys: "Shift", action: "Boost" },
  { keys: "Space", action: "Full stop" },
  { keys: "Mouse", action: "Look around · drag to swing" },
  { keys: "C", action: "Camera angle" },
  { keys: "Click", action: "Fly to a planet" },
  { keys: "1 – 5", action: "Jump to a planet" },
  { keys: "Esc", action: "Undock" },
];
