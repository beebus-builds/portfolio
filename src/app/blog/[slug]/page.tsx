import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { posts } from "@/lib/posts";
import { profile } from "@/lib/profile";

type PostProps = {
  params: Promise<{ slug: string }>;
};

function findPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostProps): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — ${profile.name}`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PostProps) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

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
      <section className="site-section" aria-label="Post body">
        <div className="doc">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
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
