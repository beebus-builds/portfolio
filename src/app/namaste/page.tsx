import PageShell from "@/components/PageShell";

export const metadata = {
  title: "Namaste",
  description: "A Nepali welcome — greetings, festivals, and food from Nepal.",
};

const customs = [
  { title: "Namaste", desc: "A respectful greeting with palms pressed together — the traditional Nepali way of saying hello and showing respect." },
  { title: "Festivals", desc: "Dashain, Tihar, Holi, and Buddha Jayanti are celebrated with family, feasts, and vibrant traditions across the country." },
  { title: "Food", desc: "Dal Bhat (lentil soup with rice) is the daily staple, often accompanied by curry, pickles, and yogurt. Momos are a national favorite." },
  { title: "Hospitality", desc: "Atithi Devo Bhava — the guest is God. Nepali culture is built on warmth, generosity, and deep community bonds." },
];

const phrases = [
  { nepali: "नमस्ते", english: "Namaste", meaning: "Hello / Greetings" },
  { nepali: "तपाईंलाई भेटेर खुशी लाग्यो", english: "Tapailai bhetera khushi lagyo", meaning: "Nice to meet you" },
  { nepali: "सधैं खुशी रहनुहोस्", english: "Sadhain khushi rahanuhos", meaning: "Stay happy always" },
  { nepali: "शुभ कामना", english: "Shubha kamana", meaning: "Best wishes" },
  { nepali: "धन्यवाद", english: "Dhanyabad", meaning: "Thank you" },
];

export default function NamastePage() {
  return (
    <PageShell>
      <section className="mb-16 thread">
        <div className="section-accent" />
        <div className="text-center md:text-left offset-left">
          <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
            A Nepali Welcome
          </h1>
          <p className="text-lg font-mono text-white/50 max-w-md">
            तपाईंलाई यो डिजिटल स्थानमा स्वागत छ।
          </p>
          <p className="text-sm font-mono text-white/30 mt-1">Welcome to this digital space.</p>
        </div>
      </section>

      <div className="thread">
      <section className="mb-16 thread-dot offset-left">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Nepali Culture &amp; Traditions</h2>
        <div className="grid-asym">
          {customs.map((c) => (
            <div key={c.title} className="neon-card border border-white/5 rounded-xl p-6">
              <h3 className="text-base font-mono text-white tracking-wide mb-2">{c.title}</h3>
              <p className="text-sm font-mono text-white/45 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="mb-16 thread-dot offset-right">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Common Phrases</h2>
        <div className="neon-card border border-white/5 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {phrases.map((p) => (
              <div key={p.nepali} className="px-6 py-4 flex items-center justify-between gap-4 bg-terminal-900/50">
                <div className="min-w-0">
                  <p className="text-base font-mono text-white">{p.nepali}</p>
                  <p className="text-xs font-mono text-white/30 italic">{p.english}</p>
                </div>
                <span className="text-xs font-mono text-white/35 shrink-0">{p.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="thread-dot">
        <div className="section-accent" />
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <div className="w-12 h-12 rounded-full bg-gold-400/10 flex items-center justify-center mx-auto mb-4">
            <span className="shape-line" style={{ width: 20, background: 'rgba(255,215,0,0.4)', transform: 'rotate(45deg)' }} />
          </div>
          <p className="text-2xl font-mono text-gold-400 mb-2">स्वागत छ! Welcome!</p>
          <p className="text-sm font-mono text-white/35">May your journey through these pages be inspiring.</p>
        </div>
      </section>
      </div>
    </PageShell>
  );
}