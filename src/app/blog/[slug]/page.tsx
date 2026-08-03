import { getBlogPost } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import Link from "next/link";
import PageShell from "@/components/PageShell";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return (
      <PageShell title="Not Found" subtitle="">
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-sm font-mono text-white/50">Post not found.</p>
          <Link href="/blog" className="inline-block mt-4 text-xs font-mono text-neon-400">
            ← Back to Blog
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={post.title} subtitle="">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            datePublished: post.date,
            description: post.excerpt,
            keywords: post.tags.join(", "),
            author: { "@type": "Person", name: "Bibash Poudel", url: "https://bibashpoudel.dev" },
          }),
        }}
      />
      <article className="thread">
        <section className="mb-8 thread-dot">
          <div className="section-accent" />
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-white/30">{post.date}</span>
            <span className="text-[10px] font-mono text-white/20">·</span>
            <span className="text-[10px] font-mono text-white/30">{post.readingTime} min read</span>
          </div>
          <div className="flex gap-2 mt-3">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[9px] font-mono px-2 py-0.5 rounded border border-white/10 text-white/40 bg-terminal-800/50">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-16 rail-card">
          <div
            className="md-body border-l-2 border-neon-400/20 pl-6"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />
        </section>

        <section>
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-mono text-white/30">Blog</span>
              <Link href="/blog" className="text-xs font-mono text-neon-400 hover:underline">
                ← All Posts
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PageShell>
  );
}