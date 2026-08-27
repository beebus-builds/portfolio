import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ChatWidget from "@/components/ChatWidget";
import Hero from "@/components/Hero";
import { projects } from "@/lib/projects";

export const dynamic = "force-dynamic";

const stack = ["Next.js", "TypeScript", "React", "Node.js", "Three.js", "Tailwind", "Postgres", "Figma"];

export default function Home() {
  const featured = projects.slice(0, 4);

  return (
    <div className="portfolio-shell min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <Hero />

        <section className="portfolio-section" id="work">
          <div className="portfolio-container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">01 / SELECTED WORK</span>
                <h2>Things I&apos;ve built.</h2>
              </div>
              <Link href="/projects" className="text-link">View all work ↗</Link>
            </div>
            <div className="project-grid">
              {featured.map((project, index) => (
                <Link href={`/projects/${project.slug}`} key={project.slug} className={`project-card ${index === 0 ? "project-card-featured" : ""}`}>
                  <div className="project-card-top">
                    <span className="project-number">0{index + 1}</span>
                    <span className="project-arrow">↗</span>
                  </div>
                  <div className="project-preview" style={{ "--accent": project.color } as React.CSSProperties}>
                    <span>{project.title.charAt(0)}</span>
                  </div>
                  <div className="project-info">
                    <div>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                    </div>
                    <div className="project-tags">{project.tech.slice(0, 3).map((tech) => <span key={tech}>{tech}</span>)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="portfolio-section about-strip">
          <div className="portfolio-container about-grid">
            <div>
              <span className="eyebrow">02 / ABOUT</span>
              <h2>I turn ideas into <em>useful</em> digital products.</h2>
            </div>
            <div className="about-copy">
              <p>I&apos;m Bibash Poudel, a full-stack developer focused on thoughtful interfaces, reliable systems, and fast web experiences.</p>
              <p>I care about the details people feel: clear interactions, strong typography, responsive layouts, and code that stays maintainable.</p>
              <Link href="/about" className="text-link">More about me ↗</Link>
            </div>
          </div>
        </section>

        <section className="portfolio-section stack-section">
          <div className="portfolio-container">
            <span className="eyebrow">03 / TOOLKIT</span>
            <div className="stack-head">
              <h2>My everyday stack.</h2>
              <p>Tools I use to design, build, ship, and iterate.</p>
            </div>
            <div className="stack-list">{stack.map((item, i) => <span key={item}><b>0{i + 1}</b>{item}</span>)}</div>
          </div>
        </section>

        <section className="portfolio-section contact-cta">
          <div className="portfolio-container">
            <span className="eyebrow">04 / LET&apos;S TALK</span>
            <h2>Have an idea?<br /><em>Let&apos;s make it real.</em></h2>
            <div className="cta-row">
              <Link href="/contact" className="primary-cta">Start a conversation ↗</Link>
              <a href="mailto:bibashpoudel@email.com" className="secondary-cta">bibashpoudel@email.com</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
