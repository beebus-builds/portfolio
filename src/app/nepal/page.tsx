import ScrollTrigger from "@/components/ScrollTrigger";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "Nepal",
  description: "About the home country — mountains, culture, and code from Nepal.",
};

const quickFacts = [
  { label: "Highest Peak", value: "Mount Everest — 8,848m", detail: "The world's tallest mountain, known as Sagarmatha in Nepali. A symbol of national pride and resilience." },
  { label: "UNESCO Sites", value: "4 Heritage Sites", detail: "Lumbini (birthplace of Buddha), Pashupatinath, Swayambhunath Stupa, and Bhaktapur Durbar Square." },
  { label: "Flag", value: "Only non-rectangular flag", detail: "The pennant-shaped flag represents the Himalayan mountains and the two major religions — Hinduism and Buddhism." },
  { label: "Timezone", value: "UTC+5:45", detail: "One of only two time zones in the world with a 45-minute offset. The other is the Chatham Islands." },
];

const culture = [
  { title: "Languages", desc: "Nepali (नेपाली) is the official language spoken by 45% as mother tongue. Over 120 ethnic languages and dialects are spoken across the country." },
  { title: "Festivals", desc: "Dashain (15 days) and Tihar (festival of lights) are the biggest celebrations. Nepal has over 50 festivals annually, many tied to lunar calendars." },
  { title: "Cuisine", desc: "Dal Bhat (lentils & rice) is the daily staple. Momos (dumplings), sel roti, gundruk, and dhindo are traditional favorites enjoyed nationwide." },
  { title: "Arts & Music", desc: "Rich traditions in folk music (lok geet), classical dance, and architecture. Newar artisans are renowned for intricate woodcarving and metalwork." },
];

const devScene = [
  { metric: "2,000+", label: "IT Graduates Yearly" },
  { metric: "500+", label: "Tech Startups" },
  { metric: "3rd", label: "Largest Remittance Economy in South Asia" },
];

export default function NepalPage() {
  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
      <section className="mb-16 thread">
        <div className="section-accent" />
        <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
          गौरवशाली नेपाल
        </h1>
        <p className="text-base font-mono text-white/55 mb-2">Land of Mountains, Culture &amp; Code</p>
        <p className="text-sm font-mono text-white/35 max-w-lg leading-relaxed">
          A small country with a big heart — nestled in the Himalayas, rich in culture, and home to a growing community
          of passionate developers building for the world.
        </p>
      </section>
      </ScrollTrigger>

      <div className="thread">
      <section className="mb-16 thread-dot offset-left">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Quick Facts</h2>
        <div className="grid-asym">
          {quickFacts.map((f) => (
            <div key={f.label} className="neon-card border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="shape-square" style={{ background: `linear-gradient(135deg, rgba(74,240,255,0.3), rgba(74,240,255,0.1))` }} />
                <span className="text-xs font-mono text-white/30 uppercase tracking-wider">{f.label}</span>
              </div>
              <p className="text-base font-mono text-white/75">{f.value}</p>
              <p className="text-sm font-mono text-white/40 mt-1.5 leading-relaxed">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="mb-16 thread-dot offset-right">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Culture &amp; Heritage</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {culture.map((c) => (
            <div key={c.title} className="neon-card border border-white/5 rounded-xl p-6">
              <h3 className="text-base font-mono text-white tracking-wide mb-2">{c.title}</h3>
              <p className="text-sm font-mono text-white/45 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="mb-16 thread-dot">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Developer Ecosystem</h2>
        <div className="neon-card border border-white/5 rounded-xl p-6">
          <div className="grid gap-6 md:grid-cols-3 mb-5">
            {devScene.map((d) => (
              <div key={d.label} className="text-center neon-card border border-white/5 rounded-lg p-5 bg-terminal-800/50">
                <p className="text-2xl font-mono text-gold-400">{d.metric}</p>
                <p className="text-xs font-mono text-white/30 uppercase tracking-wider mt-1">{d.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm font-mono text-white/45 leading-relaxed text-center">
            Nepal&apos;s tech scene is growing rapidly. Remote-first work culture, a young and ambitious population,
            and increasing internet penetration are driving a new wave of Nepali developers building for the global market.
          </p>
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="thread-dot">
        <div className="section-accent" />
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-lg font-mono text-gold-400 italic leading-relaxed">
            &ldquo;Software from the Himalayas — built with altitude attitude.&rdquo;
          </p>
        </div>
      </section>
      </div>
    </PageShell>
  );
}