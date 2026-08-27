import { getBlogPost } from "@/lib/posts";
import { renderMarkdown, extractHeadings } from "@/lib/markdown";
import { incrementPostViews, getPostViews, listComments } from "@/lib/db";
import { addCommentAction } from "./actions";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import ReadingProgress from "@/components/blog/ReadingProgress";
import TableOfContents from "@/components/blog/TableOfContents";
import ShareWidget from "@/components/blog/ShareWidget";
import CodeCopyEnhancer from "@/components/blog/CodeCopyEnhancer";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found" };
  const ogTitle = encodeURIComponent(post.title);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [{ url: `/og?type=blog&title=${ogTitle}&subtitle=${encodeURIComponent(post.tags[0] || "DevVerse Blog")}`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`/og?type=blog&title=${ogTitle}`],
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return (
      <PageShell>
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-sm font-mono text-white/50">Post not found.</p>
          <Link href="/blog" className="inline-block mt-4 text-xs font-mono text-neon-400">
            ← Back to Blog
          </Link>
        </div>
      </PageShell>
    );
  }

  // Increment view count
  await incrementPostViews(slug);
  const views = await getPostViews(slug);

  // Fetch existing comments
  const comments = await listComments(slug);
  const submitComment = addCommentAction.bind(null, slug);
  const toc = extractHeadings(post.content);

  return (
    <PageShell>
      <ReadingProgress />
      <CodeCopyEnhancer />
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
      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents items={toc} />
            <div className="mt-8">
              <ShareWidget title={post.title} slug={post.slug} />
            </div>
          </div>
        </aside>

        <article>
          <Link href="/blog" className="inline-block text-xs font-mono text-white/30 hover:text-neon-400 transition-colors mb-6">
            ← All posts
          </Link>

          {post.cover && (
            <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-white/10 mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.cover} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <header className="mb-10">
            <p className="comment-label mb-3">blog/{post.slug}.md</p>
            <h1 className="text-3xl md:text-4xl font-mono text-white tracking-tight leading-tight mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono text-white/30">{post.date}</span>
              <span className="text-[10px] font-mono text-white/20">·</span>
              <span className="text-[10px] font-mono text-white/30">{post.readingTime} min read</span>
              <span className="text-[10px] font-mono text-white/20">·</span>
              <span className="text-[10px] font-mono text-white/30">{views} views</span>
              {post.tags.map((t) => (
                <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded border border-white/10 text-white/30 bg-terminal-800/50">
                  {t}
                </span>
              ))}
            </div>
          </header>

          {/* Article body — offset rail keeps a code-margin feel through long-form text */}
          <section className="mb-16 grid md:grid-cols-[2px_1fr] gap-8">
            <div className="hidden md:block bg-gradient-to-b from-neon-400/20 via-neon-400/5 to-transparent rounded-full" />
            <div
              className="md-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />
          </section>

          {/* Mobile share */}
          <div className="mb-12 lg:hidden">
            <ShareWidget title={post.title} slug={post.slug} />
          </div>

          {/* Comments Section */}
          <section className="mb-16">
            <div className="term-window">
              <div className="term-titlebar">
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-path">~/comments ({comments.length})</span>
              </div>
              <div className="term-body">
                <div className="space-y-3 mb-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-l-2 border-white/10 pl-4 py-1">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{comment.name}</span>
                      <p className="text-sm font-mono text-white/60 leading-relaxed mt-1">{comment.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-xs font-mono text-white/40">No comments yet — be the first.</p>
                  )}
                </div>

                <form action={submitComment} className="space-y-3 pt-5 border-t border-white/5 max-w-md">
                  <div>
                    <label className="block text-xs font-mono text-white/40 mb-1">
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="name"
                      required
                      className="w-full bg-terminal-800 border border-white/10 text-white rounded px-3 py-2 text-xs focus:border-neon-400 outline-none"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-white/40 mb-1">
                      Comment <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="content"
                      rows={3}
                      required
                      className="w-full bg-terminal-800 border border-white/10 text-white rounded px-3 py-2 text-xs resize-none focus:border-neon-400 outline-none"
                      placeholder="Write a comment..."
                    />
                  </div>
                  <button type="submit" className="btn-neon w-full text-xs py-2 justify-center">
                    Post Comment
                  </button>
                </form>
              </div>
            </div>
          </section>
        </article>
      </div>
    </PageShell>
  );
}
