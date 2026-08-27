import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ChatWidget from "@/components/ChatWidget";
import { projects } from "@/lib/projects";

export const dynamic = "force-dynamic";

const stack = ["Next.js", "TypeScript", "React", "Node.js", "Three.js", "Tailwind", "Postgres", "Figma"];
const services = ["Frontend engineering", "Full-stack development", "Interface design", "Performance & accessibility"];
const principles = [["01", "Clarity", "Make the important thing obvious."], ["02", "Craft", "Sweat the details users actually notice."], ["03", "Systems", "Build foundations that stay maintainable."]];
const process = [["01", "Understand", "Goals, users, constraints."], ["02", "Shape", "Structure, interface, interaction."], ["03", "Build", "Components, APIs, data, testing."], ["04", "Refine", "Performance, accessibility, polish."]];

function Slot({ label, className = "" }: { label: string; className?: string }) {
  return <div className={`image-slot ${className}`}><div className="image-slot-grid" /><span>{label}</span><b>IMAGE</b></div>;
}

function Index({ children }: { children: React.ReactNode }) {
  return <span className="section-index">{children}</span>;
}

export default function Home() {
  const featured = projects.slice(0, 4);

  return (
    <div className="neo-shell min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="neo-hero hero-premium">
          <div className="hero-grid-bg" />
          <div className="hero-orb hero-orb-a" />
          <div className="hero-orb hero-orb-b" />
          <div className="neo-container hero-layout">
            <div className="hero-kicker"><span>01</span> BIBASH POUDEL <i /><span className="hero-kicker-meta">WEB / PRODUCT / CODE</span></div>
            <div className="hero-title-wrap">
              <div>
                <h1><span>Build<span className="hero-dot">.</span></span><span className="outline">Better.</span></h1>
                <p className="hero-deck">Web developer building interfaces, systems and digital products.</p>
              </div>
              <Slot label="YOUR PORTRAIT / HERO IMAGE" className="hero-image-slot" />
            </div>
            <div className="hero-bottom">
              <p className="hero-intro">I build web experiences where <strong>good engineering</strong> meets thoughtful interface design.</p>
              <div className="hero-actions"><Link href="/projects" className="magnetic-link">Explore work <span>↗</span></Link><Link href="/about" className="quiet-link">More about me</Link></div>
              <a href="#introduction" className="scroll-mark"><span>SCROLL TO EXPLORE</span><b>↓</b></a>
            </div>
          </div>
        </section>

        <section id="introduction" className="manifesto manifesto-premium"><div className="neo-container manifesto-grid"><Index>02 / INTRODUCTION</Index><div><p className="manifesto-big">I turn ideas into <em>working products</em> — from the first interface to the systems behind it.</p><div className="manifesto-foot"><p>Understand the problem, design a clear solution, write solid code, and keep improving it after launch.</p><span>02—25</span></div></div></div></section>

        <section className="focus-section"><div className="neo-container focus-layout"><div><Index>03 / CURRENT FOCUS</Index><h2>What I&apos;m<br /><em>working on.</em></h2></div><div className="focus-list">{["Shipping production web work", "Deepening React / Next.js", "Exploring 3D and creative development"].map((x, i) => <div key={x}><span>0{i + 1}</span><strong>{x}</strong><b>NOW</b></div>)}</div></div></section>

        <section className="work-section work-premium" id="work"><div className="neo-container"><div className="section-top"><div><Index>04 / SELECTED WORK</Index><h2>Things I&apos;ve<br /><em>built.</em></h2></div><div className="work-counter"><strong>{String(projects.length).padStart(2, "0")}</strong><span>PROJECTS<br />IN ARCHIVE</span></div></div><div className="neo-projects">{featured.map((p, i) => <Link href={`/projects/${p.slug}`} key={p.slug} className={`neo-project ${i === 0 ? "neo-project-wide" : ""}`} data-project-color={p.color}><div className="project-meta"><span>0{i + 1} / {p.tag}</span><span>{p.tech.slice(0, 3).join(" · ")}</span></div><div className="project-art"><div className="art-lines" /><div className="art-corner">VIEW CASE ↗</div><strong>{p.title.charAt(0)}</strong><span className="art-label">PROJECT / {String(i + 1).padStart(2, "0")}</span></div><div className="project-caption"><div><h3>{p.title}</h3><p>{p.description}</p></div><span className="project-arrow">↗</span></div></Link>)}</div></div></section>

        <section className="spotlight-section"><div className="neo-container"><Index>05 / PROJECT SPOTLIGHT</Index><div className="spotlight-grid"><Slot label="FEATURED PROJECT / LARGE SCREENSHOT" className="spotlight-image" /><div className="spotlight-copy"><span>CASE STUDY / 01</span><h2>Let the work<br /><em>breathe.</em></h2><p>Show the interface, decisions and technical thinking behind the result.</p><Link href={featured[0] ? `/projects/${featured[0].slug}` : "/projects"} className="underline-link">Open featured project →</Link></div></div></div></section>

        <section className="archive-section"><div className="neo-container"><div className="section-top"><div><Index>06 / PROJECT ARCHIVE</Index><h2>More work,<br /><em>different problems.</em></h2></div><Link href="/projects" className="circle-link">FULL ARCHIVE ↗</Link></div><div className="archive-grid">{projects.slice(0, 6).map((p, i) => <Link href={`/projects/${p.slug}`} key={p.slug}><Slot label={`${p.title} / IMAGE`} className={i % 3 === 0 ? "archive-tall" : ""} /><div><span>{p.tag}</span><h3>{p.title}</h3></div></Link>)}</div></div></section>

        <section className="capabilities capabilities-premium"><div className="neo-container"><div className="section-top"><div><Index>07 / CAPABILITIES</Index><h2>Useful<br /><em>by design.</em></h2></div><p className="cap-intro">From interface decisions to the code that makes them real.</p></div><div className="cap-list">{services.map((x, i) => <div key={x}><span>0{i + 1}</span><strong>{x}</strong><b>↗</b></div>)}</div></div></section>

        <section className="principles-section"><div className="neo-container"><Index>08 / ENGINEERING PRINCIPLES</Index><div className="principles-heading"><h2>Less noise.<br /><em>More intent.</em></h2><p>Three simple rules guide the work.</p></div><div className="principles-grid">{principles.map(([n, t, d]) => <article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p><i>↗</i></article>)}</div></div></section>

        <section className="design-section"><div className="neo-container design-layout"><Slot label="FIGMA / UI DESIGN SCREENSHOT" className="design-image" /><div><Index>09 / DESIGN</Index><h2>Interface is part of<br /><em>the engineering.</em></h2><p>Hierarchy, interaction and responsive systems make products easier to understand.</p><Link href="/projects" className="underline-link">See interface work →</Link></div></div></section>

        <section className="process-section process-premium"><div className="neo-container process-layout"><div className="process-sticky"><Index>10 / PROCESS</Index><h2>From rough<br />idea to <em>real.</em></h2><p>Clear stages connect creative decisions to engineering reality.</p></div><div className="process-rail">{process.map(([n, t, d]) => <div className="process-step" key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div><b>↗</b></div>)}</div></div></section>

        <section className="toolkit-section toolkit-premium"><div className="neo-container"><div className="section-top"><div><Index>11 / TECHNICAL TOOLKIT</Index><h2>The stack<br /><em>behind it.</em></h2></div><p className="cap-intro">Technologies I use to build maintainable software.</p></div><div className="toolkit-grid">{stack.map((x, i) => <div key={x}><span>0{i + 1}</span><strong>{x}</strong><small>CORE TOOL</small></div>)}</div></div></section>

        <section className="technical-visual"><div className="neo-container technical-visual-grid"><div><Index>12 / UNDER THE HOOD</Index><h2>The details<br /><em>matter.</em></h2><p>Architecture, reusable components, APIs, data and deployment shape the final experience.</p></div><Slot label="CODE / TERMINAL / ARCHITECTURE SCREENSHOT" className="code-image" /></div></section>

        <section className="performance-section"><div className="neo-container"><Index>13 / PERFORMANCE</Index><div className="performance-layout"><div><h2>Fast is<br /><em>a feature.</em></h2><p>Performance, accessibility and responsive behavior are part of the build.</p></div><div className="metric-board"><div><strong>01</strong><span>LIGHTWEIGHT<br />UI</span></div><div><strong>02</strong><span>ACCESSIBLE<br />INTERACTION</span></div><div><strong>03</strong><span>RESPONSIVE<br />LAYOUTS</span></div></div></div></div></section>

        <section className="wordpress-section"><div className="neo-container wordpress-layout"><div><Index>14 / WORDPRESS</Index><h2>Production<br /><em>web work.</em></h2><p>Custom WordPress implementation, builders, SEO, performance, hosting and maintenance.</p><Link href="/projects" className="underline-link">View projects →</Link></div><Slot label="WORDPRESS PROJECT / SCREENSHOT" className="wordpress-image" /></div></section>

        <section className="react-section"><div className="neo-container"><div className="section-top"><div><Index>15 / REACT + NEXT.JS</Index><h2>Apps that<br /><em>scale.</em></h2></div><span className="section-stamp">REACT / NEXT / TS</span></div><div className="react-grid"><Slot label="APP SCREENSHOT / 01" /><Slot label="APP SCREENSHOT / 02" /><div className="react-copy"><p>Component architecture, state, routing, APIs and responsive UI — built as a system.</p></div></div></div></section>

        <section className="experience-section experience-premium"><div className="neo-container"><Index>16 / EXPERIENCE</Index><div className="experience-row"><div className="experience-year">2026</div><div><span className="experience-label">CURRENT CHAPTER</span><h2>Web development<br /><em>&amp; product work.</em></h2><p>Production websites and digital experiences across WordPress, React, Next.js, Figma, hosting and performance.</p></div><span className="experience-mark">01</span></div><div className="experience-row secondary"><div className="experience-year">NEXT</div><div><span className="experience-label">EXPLORING</span><h2>Learning through<br /><em>experiments.</em></h2><p>Exploring 3D, creative development and modern frontend architecture.</p></div><span className="experience-mark">02</span></div></div></section>

        <section className="education-section"><div className="neo-container education-grid"><div><Index>17 / EDUCATION</Index><h2>Learning<br /><em>the foundations.</em></h2></div><div className="education-card"><span>2023 — PRESENT</span><h3>Bachelor of Information Technology</h3><p>Bhaktapur Multiple Campus</p></div></div></section>

        <section className="lab-section lab-premium"><div className="neo-container lab-layout"><div><Index>18 / LAB</Index><h2>Curious<br /><em>by default.</em></h2></div><div className="lab-note"><Slot label="3D / BLENDER / GAME DEV IMAGE" className="lab-image" /><span>EXPERIMENTS / SIDE PROJECTS</span><p>Interaction, graphics, 3D and game-development ideas explored through side projects.</p><Link href="/lab" className="underline-link">Enter the lab →</Link></div></div></section>

        <section className="github-section"><div className="neo-container github-layout"><div><Index>19 / GITHUB</Index><h2>Code is<br /><em>the archive.</em></h2><p>Projects and experiments live in code.</p></div><a href="https://github.com/beebus-builds" target="_blank" rel="noopener noreferrer" className="github-panel"><span>github.com / beebus-builds</span><strong>OPEN GITHUB ↗</strong><div className="contribution-grid">{Array.from({ length: 42 }).map((_, i) => <i key={i} style={{ opacity: 0.15 + ((i * 7) % 6) * 0.12 }} />)}</div></a></div></section>

        <section className="learning-section"><div className="neo-container learning-layout"><Slot label="LEARNING / BOOKS / DOCUMENTATION" className="learning-image" /><div><Index>20 / LEARNING</Index><h2>Still<br /><em>figuring it out.</em></h2><p>I learn by building, breaking things, reading documentation and trying again.</p></div></div></section>

        <section className="writing-section writing-premium"><div className="neo-container"><div className="section-top"><div><Index>21 / NOTES</Index><h2>Things I&apos;m<br /><em>figuring out.</em></h2></div><Link href="/blog" className="circle-link">WRITING ↗</Link></div><div className="writing-grid">{[["01 / ENGINEERING", "Building interfaces that stay maintainable."], ["02 / PROCESS", "Making technical work easier to understand."], ["03 / LEARNING", "Experiments, mistakes and better approaches."]].map(([tag, title]) => <article key={tag}><span>{tag}</span><h3>{title}</h3><p>Notes on components, structure, decisions and useful approaches.</p><b>Read note ↗</b></article>)}</div></div></section>

        <section className="perspective-section"><div className="neo-container perspective-layout"><div><Index>22 / PERSPECTIVE</Index><h2>Built from<br /><em>Nepal.</em></h2></div><Slot label="NEPAL / PERSONAL IMAGE" className="perspective-image" /><p>Based in Nepal, working remotely and turning limited resources into useful outcomes.</p></div></section>

        <section className="about-section about-premium"><div className="neo-container about-layout"><Index>23 / ABOUT</Index><div className="about-main"><div className="about-number">BP<span>01</span></div><div><span className="about-eyebrow">DEVELOPER / DESIGNER / LEARNER</span><h2>Developer.<br /><span>Designer.</span><br />Problem solver.</h2><p>Based in Nepal, building for the web. I care about useful products, clean implementation and interfaces that don&apos;t get in the user&apos;s way.</p><Link href="/about" className="underline-link">Read the full story →</Link></div></div></div></section>

        <section className="faq-section"><div className="neo-container faq-layout"><div><Index>24 / FAQ</Index><h2>Questions,<br /><em>answered.</em></h2></div><div className="faq-list">{[["What do you build?", "Websites, interfaces and full-stack applications."], ["What technologies do you use?", "React, Next.js, TypeScript, Node.js, WordPress and related tooling."], ["Can you work on an existing product?", "Yes. I can work within an existing codebase, design system or CMS."], ["Where are you based?", "Nepal, working remotely."]].map(([q, a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section>

        <section className="contact-section contact-premium"><div className="neo-container"><Index>25 / CONTACT</Index><div className="contact-heading"><h2>Have a good<br /><em>problem?</em></h2></div><div className="contact-footer"><Link href="/contact" className="big-contact">Start a conversation <span>↗</span></Link><a href="mailto:bibashpoudel@email.com">bibashpoudel@email.com</a></div></div></section>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
