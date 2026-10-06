import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { getPost, listPosts } from "@/lib/postsStore";
import { profile } from "@/lib/profile";

type PostProps = {
  params: Promise<{ slug: string }>;
};

// Post bodies live in Neon now, so slugs are resolved at request time. Unknown
// slugs 404 normally; `dynamicParams` stays on so a post published in the
// admin is reachable immediately, without a redeploy.
export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({ params }: PostProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — ${profile.name}`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.cover.src, alt: post.cover.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.cover.src],
    },
  };
}

export default async function PostPage({ params }: PostProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const all = await listPosts();
  const more = all.filter((candidate) => candidate.slug !== post.slug).slice(0, 2);

  return (
    <SitePage
      hero={
        <PageHero
          kicker={`${post.date} · ${post.minutes} min read`}
          title={post.title}
          lede={post.excerpt}
          meta={post.tags.map((tag) => `#${tag}`)}
        />
      }
    >
      <figure className="post-cover">
        {/* Procedural SVG: cached hard, and legible at any width. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.cover.src}
          alt={post.cover.alt}
          width={1200}
          height={630}
          loading="eager"
          decoding="async"
        />
        <figcaption>{post.excerpt}</figcaption>
      </figure>

      <section className="site-section" aria-label="Post body">
        <div className="doc">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}

          {post.quote && (
            <blockquote className="post-quote">
              <p>{post.quote}</p>
            </blockquote>
          )}

          {post.sections?.map((section) => (
            <div className="post-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}

              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}

              {section.code && (
                <figure className="post-code">
                  <figcaption>{section.code.lang}</figcaption>
                  <pre>
                    <code>{section.code.snippet}</code>
                  </pre>
                </figure>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="site-section" aria-label="More posts">
        <div className="site-grid" style={{ listStyle: "none", padding: 0 }}>
          {more.map((other) => (
            <li className="site-card" key={other.slug}>
              <Link className="site-card__media" href={`/blog/${other.slug}`} tabIndex={-1} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={other.cover.src} alt="" width={1200} height={630} loading="lazy" decoding="async" />
              </Link>
              <span className="site-card__kicker">
                {other.date} · {other.minutes} min read
              </span>
              <h3>
                <Link href={`/blog/${other.slug}`}>{other.title}</Link>
              </h3>
              <p>{other.excerpt}</p>
            </li>
          ))}
        </div>
      </section>

      <section className="site-section" aria-label="Keep reading">
        <div className="flight-teaser">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="section-head__kicker">Next</p>
            <h2 className="section-head__title">More from the logbook</h2>
          </div>
          <div className="site-hero__actions" style={{ marginBottom: 0 }}>
            <Link className="btn" href="/blog">
              ← All posts
            </Link>
            <Link className="btn btn--ghost" href="/projects">
              The archive
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}