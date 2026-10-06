import type { Metadata } from "next";
import SectionHeading from "@/components/site/SectionHeading";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { countMessages } from "@/lib/contact";
import { getProgressStats, type ProgressStats } from "@/lib/progress";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `Stats — ${profile.name}`,
  description: "Live aggregate stats from the flight deck: visitors, planets docked, achievements unlocked, and messages received.",
};

export const dynamic = "force-dynamic";

const EMPTY: ProgressStats & { messages: number } = {
  visitors: 0,
  planetsVisited: 0,
  achievementsUnlocked: 0,
  topAchievements: [],
  messages: 0,
};

async function loadStats() {
  try {
    const [progress, messages] = await Promise.all([getProgressStats(), countMessages()]);
    return { ...progress, messages };
  } catch (error) {
    console.error("/stats failed to load:", error);
    return EMPTY;
  }
}

export default async function StatsPage() {
  const stats = await loadStats();

  return (
    <SitePage
      hero={
        <PageHero
          kicker="Telemetry"
          title="Flight deck, by the numbers"
          lede="Live aggregates from the database — no PII, just how the ship is being flown."
          meta={[`${stats.visitors} pilots`, `${stats.messages} messages`, "Refreshes on each visit"]}
        />
      }
    >
      <section className="site-section" aria-label="Headline stats">
        <ul className="site-grid">
          <li className="site-card">
            <span className="site-card__kicker">Visitors</span>
            <h3>{stats.visitors}</h3>
            <p>Unique pilots who have flown at least once.</p>
          </li>
          <li className="site-card">
            <span className="site-card__kicker">Planets docked</span>
            <h3>{stats.planetsVisited}</h3>
            <p>Total section visits across every flight.</p>
          </li>
          <li className="site-card">
            <span className="site-card__kicker">Achievements</span>
            <h3>{stats.achievementsUnlocked}</h3>
            <p>Total badges unlocked across all pilots.</p>
          </li>
          <li className="site-card">
            <span className="site-card__kicker">Signals</span>
            <h3>{stats.messages}</h3>
            <p>Messages received through the contact channel.</p>
          </li>
        </ul>
      </section>

      <section className="site-section" aria-labelledby="top-achievements">
        <SectionHeading
          kicker="Leaderboard"
          title="Most unlocked achievements"
          lede="The badges pilots earn most often."
        />
        {stats.topAchievements.length === 0 ? (
          <p>No achievements unlocked yet — be the first pilot in.</p>
        ) : (
          <ul className="site-grid" id="top-achievements">
            {stats.topAchievements.map((entry, index) => (
              <li className="site-card" key={entry.id}>
                <span className="site-card__kicker">#{index + 1}</span>
                <h3>{entry.id}</h3>
                <p>{entry.unlocks} unlocks</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SitePage>
  );
}
