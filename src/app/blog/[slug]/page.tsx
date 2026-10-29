import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SitePage, { PageHero } from "@/components/site/SitePage";
import PostBodyView from "@/components/blog/PostBodyView";
import { getPost, listPosts } from "@/lib/postsStore";
import { blogPostingJsonLd } from "@/lib/jsonld";
import { profile } from "@/lib/profile";
import { absoluteUrl } from "@/lib/site";

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
    alternates: {
      canonical: absoluteUrl(`/blog/${post.slug}`),
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
          <PostBodyView body={post.body} sections={post.sections} quote={post.quote} />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd(post)) }}
      />

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
            <Link className="btn btn--ghost" href="/?planet=projects">
              The archive
            </Link>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
