import type { ReactNode } from "react";
import Link from "next/link";
import ContactForm from "@/components/space/ContactForm";
import { anchorId } from "@/lib/anchors";

/**
 * The content primitives used by the standard pages. Every block is a server
 * component except the signal form, which owns its own client state. Markup
 * stays intentionally plain so the same blocks read well on any page.
 */

export type Card = {
  kicker?: string;
  title: string;
  body: string;
  meta?: string;
  tags?: string[];
  href?: string;
};

export type Block =
  | { kind: "prose"; paragraphs: string[] }
  | { kind: "cards"; items: Card[] }
  | { kind: "facts"; items: { label: string; value: string }[] }
  | { kind: "timeline"; items: { when: string; title: string; body: string; points?: string[] }[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "steps"; items: { title: string; body: string }[] }
  | { kind: "quote"; text: string; by: string }
  | { kind: "faq"; items: { q: string; a: string }[] }
  | { kind: "metrics"; items: { value: string; label: string; note?: string }[] }
  | { kind: "links"; items: { label: string; value: string; href: string; note: string }[] }
  | { kind: "chips"; items: string[] }
  | { kind: "form" };

function Cards({ items }: { items: Card[] }) {
  return (
    <ul className="site-grid" style={{ listStyle: "none", padding: 0 }}>
      {items.map((item) => (
        <li className="site-card" key={item.title} id={anchorId(item.title)}>
          {item.kicker && <p className="site-card__kicker">{item.kicker}</p>}
          {item.href ? (
            <h3>
              <Link href={item.href}>{item.title}</Link>
            </h3>
          ) : (
            <h3>{item.title}</h3>
          )}
          <p>{item.body}</p>
          {item.meta && <p className="site-card__meta">{item.meta}</p>}
          {item.tags && item.tags.length > 0 && (
            <ul className="site-card__tags" style={{ listStyle: "none", padding: 0 }}>
              {item.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Section({
  id,
  index,
  kicker,
  title,
  lede,
  children,
}: {
  id: string;
  index: number;
  kicker: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <section className="doc-section" id={id} aria-label={title}>
      <div className="section-head">
        <p className="section-head__kicker">
          {String(index).padStart(2, "0")} / {kicker}
        </p>
        <h2 className="section-head__title">{title}</h2>
        {lede && <p className="section-head__lede">{lede}</p>}
      </div>
      <div className="doc-section__body">{children}</div>
    </section>
  );
}

export function Block({ block }: { block: Block }) {
  switch (block.kind) {
    case "prose":
      return (
        <div className="prose-block">
          {block.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      );
    case "cards":
      return <Cards items={block.items} />;
    case "facts":
      return (
        <dl className="site-facts">
          {block.items.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      );
    case "timeline":
      return (
        <ol className="site-timeline" style={{ listStyle: "none", padding: 0 }}>
          {block.items.map((item) => (
            <li key={item.when + item.title} id={anchorId(item.title)}>
              <span className="site-timeline__when">{item.when}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              {item.points && item.points.length > 0 && (
                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      );
    case "bullets":
      return (
        <ul className="site-bullets">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="site-steps" style={{ listStyle: "none", padding: 0 }}>
          {block.items.map((item, i) => (
            <li key={item.title}>
              <span className="site-steps__number">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="site-quote">
          <p>“{block.text}”</p>
          <cite>{block.by}</cite>
        </blockquote>
      );
    case "faq":
      return (
        <div className="site-faq">
          {block.items.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      );
    case "metrics":
      return (
        <ul className="site-metrics" style={{ listStyle: "none", padding: 0 }}>
          {block.items.map((item) => (
            <li key={item.label}>
              <b>{item.value}</b>
              <span>{item.label}</span>
              {item.note && <small>{item.note}</small>}
            </li>
          ))}
        </ul>
      );
    case "links":
      return (
        <ul className="site-direct-links" style={{ listStyle: "none", padding: 0 }}>
          {block.items.map((item) => (
            <li key={item.label}>
              <span className="site-card__kicker">{item.label}</span>
              <a href={item.href}>
                {item.value} <span aria-hidden="true">↗</span>
              </a>
              <p>{item.note}</p>
            </li>
          ))}
        </ul>
      );
    case "chips":
      return (
        <ul className="site-chips" style={{ listStyle: "none", padding: 0 }}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "form":
      return <ContactForm />;
  }
}
