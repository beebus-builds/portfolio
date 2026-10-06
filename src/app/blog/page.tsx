import type { Metadata } from "next";
import Link from "next/link";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { posts } from "@/lib/posts";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `Blog — ${profile.name}`,
  description: `Notes from the cockpit: ${profile.name} writing about shipping real software, lessons from real launches.`,
};

export default function BlogPage() {
  // Newest first. The library is ordered by writing date, not by publish date.
  const ordered = [...posts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <SitePage
      hero={
        <PageHero
          kicker="07 / Logbook"
          title="From the logbook"
          lede="Short write-ups on what shipped, what broke, and what I would do differently. No filler, no listicles."
          meta={[`${posts.length} entries`, "Updated monthly", profile.status]}
        />
      }
    >
      <section className="site-section" aria-label="Blog posts">
        <ul className="site-grid" style={{ listStyle: "none", padding: 0 }}>
          {ordered.map((post, index) => (
            <li className="site-card site-card--post" key={post.slug}>
              <Link
                className="site-card__media"
                href={`/blog/${post.slug}`}
                tabIndex={-1}
                aria-hidden="true"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.cover.src}
                  alt=""
                  width={1200}
                  height={630}
                  loading={index < 3 ? "eager" : "lazy"}
                  decoding="async"
                />
              </Link>
              <span className="site-card__kicker">
                {post.date} · {post.minutes} min read
              </span>
              <h3>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p>{post.excerpt}</p>
              <ul className="site-card__tags">
                {post.tags.map((tag) => (
                  <li key={tag}>#{tag}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" aria-label="Keep reading">
        <div className="flight-teaser">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="section-head__kicker">Next</p>
            <h2 className="section-head__title">Want the code, not the notes?</h2>
            <p className="section-head__lede">Every post starts from a real repo in the archive.</p>
          </div>
          <div className="site-hero__actions" style={{ marginBottom: 0 }}>
            <Link className="btn" href="/projects">
              Open the archive →
            </Link>
            <Link className="btn btn--ghost" href="/contact">
              Ask about a post
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}