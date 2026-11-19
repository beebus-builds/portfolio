import { DISTRICTS, goalsFor, levelFor, type CityState } from "@/lib/citySim";

/** A short, honest chapter of the story behind the portfolio. */
export type StoryChapter = {
  id: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  /** What the visitor had to do in the city to reach this chapter. */
  unlockedBy: string;
};

export const STORY: StoryChapter[] = [
  {
    id: "origin",
    kicker: "01 / ORIGIN",
    title: "Sindhuli",
    paragraphs: [
      "I started in Sindhuli, a hill town south of Kathmandu, with a local business that needed a website and no idea how much I would end up caring about the details.",
      "The first cottages of this city are those early builds: small, practical, built by hand. They still pay the bills today.",
    ],
    unlockedBy: "Start building",
  },
  {
    id: "workshop",
    kicker: "02 / THE CRAFT",
    title: "Learning in public",
    paragraphs: [
      "WordPress and PHP were my first real programming environment. Custom themes, plugins, WooCommerce — and the occasional broken site that taught me more than any tutorial.",
      "I learned that good software is 30% code and 70% asking the right question. The workshop in this city is where that lesson lives.",
    ],
    unlockedBy: "Open a workplace",
  },
  {
    id: "green",
    kicker: "03 / THE PEOPLE",
    title: "University and the club",
    paragraphs: [
      "At university in Kathmandu, the useful part was the campus tools club. We turned coursework into deployed projects, and I mentored juniors through their first commits.",
      "iVote began there: a question about whether an election could really be private, and a lot of late nights over threat models and cryptography.",
    ],
    unlockedBy: "Plant two parks",
  },
  {
    id: "shipping",
    kicker: "04 / THE SHIPPED WORK",
    title: "Things that went live",
    paragraphs: [
      "The pharmacy app, the voting platform, the WordPress builds for international brands — each one had a real user and a real constraint.",
      "A landmark in this city is a project somebody actually used. That is the only metric that has ever mattered to me.",
    ],
    unlockedBy: "Build a landmark",
  },
  {
    id: "practice",
    kicker: "05 / THE PRACTICE",
    title: "How I work now",
    paragraphs: [
      "Today I work across Next.js, TypeScript and Postgres, often as the only developer in the room. I care about the query plan under the endpoint and the 300ms after a click.",
      "This city is a small model of that: a system with a budget, a mood, and consequences for the choices you make.",
    ],
    unlockedBy: "Reach twelve buildings",
  },
  {
    id: "open",
    kicker: "06 / WHAT'S NEXT",
    title: "The open road",
    paragraphs: [
      "I am based in Sindhuli, working with teams everywhere, and open to the next small team with a hard problem.",
      "Every district in this city opens a page with the longer version. If any of it sounds useful, the radio tower is always open.",
    ],
    unlockedBy: "Explore every district",
  },
];

/**
 * The active chapter follows the city's own progress, so the story and the
 * simulation cannot drift apart. Later chapters stay available once found.
 */
export function storyProgress(city: CityState): { active: number; unlocked: number[] } {
  const goals = goalsFor(city);
  const done = new Set(goals.filter((goal) => goal.done).map((goal) => goal.id));
  const unlocked = STORY.map((chapter, index) => {
    if (index === 0) return true;
    switch (chapter.id) {
      case "workshop":
        return done.has("business");
      case "green":
        return done.has("green");
      case "shipping":
        return done.has("landmark");
      case "practice":
        return done.has("builder");
      case "open":
        return done.has("tour");
      default:
        return false;
    }
  })
    .map((yes, index) => (yes ? index : -1))
    .filter((index) => index >= 0);

  // District exploration should also count as a visit when the player walks
  // the story without clicking every marker: gaining enough experience for
  // all districts is enough to see the last chapter.
  if (unlocked.length < STORY.length && levelFor(city.xp) === 5 && city.visited.length >= 4) {
    unlocked.push(STORY.length - 1);
  }
  return { active: unlocked.length > 0 ? Math.max(...unlocked) : 0, unlocked: [...new Set(unlocked)] };
}

export function currentChapter(city: CityState): StoryChapter {
  const { active } = storyProgress(city);
  return STORY[active] ?? STORY[0]!;
}

export function remainingDistricts(city: CityState): number {
  return DISTRICTS.filter((district) => !city.visited.includes(district.id)).length;
}
