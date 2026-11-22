import type { ReactNode } from "react";
import Link from "next/link";
import { NextRoom } from "./PageBar";
import SitePage, { PageHero } from "./SitePage";
import { Block, Section } from "./PageBlocks";
import PageWorld from "@/components/world/PageWorld";
import { worldFor } from "@/lib/pageWorlds";
import { sitePages, type PageContent, type PageSlug } from "@/lib/sitePages";

/** Internal addresses use the router; external ones and email links do not. */
function PageLink({ href, children }: { href: string; children: ReactNode }) {
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a href={href}>
        {children}
      </a>
    );
  }
  return <Link href={href}>{children}</Link>;
}

/** Renders any of the classic section pages from its content definition. */
export default function StandardPage({
  slug,
  content = sitePages[slug],
}: {
  slug: PageSlug;
  content?: PageContent;
}) {
  const world = worldFor(slug);
  return (
    <SitePage
      current={slug}
      accent={world?.accent}
      hero={
        <PageHero kicker={content.kicker} title={content.title} lede={content.lede} meta={content.meta} />
      }
      aside={world && <PageWorld world={world} sections={content.sections.map((s) => ({ id: s.id, title: s.title }))} />}
    >
      <div className="doc">
        {content.sections.map((section, index) => (
          <Section
            key={section.id}
            id={section.id}
            index={index + 1}
            kicker={section.kicker}
            title={section.title}
            lede={section.lede}
          >
            {section.blocks.map((block, blockIndex) => (
              <Block key={blockIndex} block={block} />
            ))}
          </Section>
        ))}
        <div className="page-end">
          <h2>{content.end.title}</h2>
          <p>{content.end.body}</p>
          <div className="site-hero__actions">
            <PageLink href={content.end.primary.href}>
              <span className="btn">{content.end.primary.label}</span>
            </PageLink>
            <PageLink href={content.end.secondary.href}>
              <span className="btn btn--ghost">{content.end.secondary.label}</span>
            </PageLink>
          </div>
        </div>
      </div>
      <NextRoom current={slug} />
    </SitePage>
  );
}
