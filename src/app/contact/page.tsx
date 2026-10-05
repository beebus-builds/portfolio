import Link from "next/link";
import type { Metadata } from "next";
import SectionContent from "@/components/space/SectionContent";
import SectionHeading from "@/components/site/SectionHeading";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `Contact — ${profile.name}`,
  description: `Send ${profile.name} a signal about what you are building. ${profile.responseWindow}. Also on ${profile.links.map((link) => link.label).join(", ")}.`,
};

const FAQ = [
  {
    question: "How fast will I hear back?",
    answer: `${profile.responseWindow}, usually faster. If the message needs a longer answer — architecture, estimates, timelines — I will say so in the first reply rather than going quiet.`,
  },
  {
    question: "What should the first message include?",
    answer:
      "One clear question beats a long brief. What you are building, what is broken, or what you want to understand next — plus any deadline and the stack you are on.",
  },
  {
    question: "What kind of work are you open to?",
    answer: `Full-stack product engineering (Next.js, TypeScript, Node, PostgreSQL), WordPress builds and audits, and interaction-heavy frontends. ${profile.status} for freelance and full-time conversations alike.`,
  },
  {
    question: "Prefer talking to typing?",
    answer:
      "Send a signal first with a time that suits you and your timezone — I will reply with a call link. Written context up front makes the call twice as useful.",
  },
];

export default function ContactPage() {
  return (
    <SitePage
      hero={
        <PageHero
          kicker="04 / Comms — Halcyon"
          title="Send a signal"
          lede="Tell me what you are building, what is broken, or what you want to understand next. The best collaborations usually start as one clear question."
          meta={[profile.responseWindow, profile.timezone, profile.status]}
        />
      }
    >
      <section className="site-section" aria-label="Contact form and channels">
        <div className="doc">
          <SectionContent id="contact" />
        </div>
      </section>

      <section className="site-section" aria-labelledby="contact-faq">
        <SectionHeading
          kicker="Before you transmit"
          title="Fair questions, straight answers"
        />
        <div className="faq" id="contact-faq">
          {FAQ.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="site-section" aria-label="Keep reading">
        <div className="flight-teaser">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="section-head__kicker">Meanwhile</p>
            <h2 className="section-head__title">Skim the record while you wait</h2>
            <p className="section-head__lede">
              One page, recruiter-skim ready — the fastest way to confirm I can finish things.
            </p>
          </div>
          <div className="site-hero__actions" style={{ marginBottom: 0 }}>
            <Link className="btn" href="/resume">
              Read the resume →
            </Link>
            <Link className="btn btn--ghost" href="/projects">
              Browse missions
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
