"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SiteNavbar from "@/components/site/SiteNavbar";
import SiteFooter from "@/components/site/SiteFooter";
import PostEditor, { type EditorPost } from "@/components/admin/PostEditor";

type Message = { id: number; name: string; email: string; message: string; created_at: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [posts, setPosts] = useState<EditorPost[] | null>(null);
  const [editing, setEditing] = useState<EditorPost | null>(null);
  const [tab, setTab] = useState<"inbox" | "write">("inbox");

  const authHeaders = useCallback(
    () => ({ authorization: `Bearer ${token}` }),
    [token],
  );

  async function load(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messages", { headers: authHeaders() });
      if (res.status === 401) throw new Error("Wrong token.");
      if (!res.ok) throw new Error("Could not load messages.");
      const data = (await res.json()) as { messages: Message[] };
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setMessages(null);
    } finally {
      setLoading(false);
    }
  }

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/posts", { headers: authHeaders() });
      if (res.status === 401) throw new Error("Wrong token.");
      if (!res.ok) throw new Error("Could not load posts.");
      const data = (await res.json()) as { posts: EditorPost[] };
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPosts([]);
    }
  }, [authHeaders]);

  /** Called by the editor after a save or delete so the list stays honest. */
  const refreshAfterWrite = useCallback(() => {
    if (!token) return;
    void loadPosts();
  }, [loadPosts, token]);

  useEffect(() => {
    if (!token) return;
    void loadPosts();
  }, [token, loadPosts]);

  return (
    <div className="site">
      <SiteNavbar />
      <main className="site__main" id="document">
        <header className="page-hero">
          <p className="section-head__kicker">Restricted</p>
          <h1>Control room</h1>
          <p className="page-hero__lede">
            Messages from the contact channel, and the editor for the logbook.
          </p>
        </header>

        <section className="site-section">
          <form onSubmit={load} style={{ marginBottom: "2rem" }}>
            <label htmlFor="admin-token">Admin token</label>{" "}
            <input
              id="admin-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />{" "}
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Loading…" : "Unlock"}
            </button>
            {token && (
              <div className="admin__tabs">
                <button
                  className={tab === "inbox" ? "btn" : "btn btn--ghost"}
                  type="button"
                  onClick={() => setTab("inbox")}
                >
                  Inbox
                </button>
                <button
                  className={tab === "write" ? "btn" : "btn btn--ghost"}
                  type="button"
                  onClick={() => setTab("write")}
                >
                  Write a post
                </button>
              </div>
            )}
          </form>

          {error && <p role="alert">{error}</p>}

          {token && tab === "inbox" && (
            <>
              {messages === null ? (
                <p>Enter the token and unlock to read the inbox.</p>
              ) : messages.length === 0 ? (
                <p>Inbox is empty.</p>
              ) : (
                <ul className="site-grid">
                  {messages.map((msg) => (
                    <li className="site-card" key={msg.id}>
                      <span className="site-card__kicker">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                      <h3>{msg.name}</h3>
                      <p>
                        <a href={`mailto:${msg.email}`}>{msg.email}</a>
                      </p>
                      <p>{msg.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {token && tab === "write" && (
            <>
              <section className="site-section" aria-label="Existing posts">
                <div className="section-head" style={{ marginBottom: 0 }}>
                  <p className="section-head__kicker">Library</p>
                  <h2 className="section-head__title">
                    {posts ? `${posts.length} posts` : "Loading posts…"}
                  </h2>
                </div>
                {posts && (
                  <ul className="admin__list">
                    {posts.map((post) => (
                      <li key={post.slug}>
                        <button
                          className={editing?.slug === post.slug ? "btn" : "btn btn--ghost"}
                          type="button"
                          onClick={() => setEditing(post)}
                        >
                          {post.published ? "" : "draft · "}
                          {post.title}
                        </button>{" "}
                        <Link className="admin__link" href={`/blog/${post.slug}`}>
                          view
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="site-section" aria-label="Post editor">
                <div className="section-head" style={{ marginBottom: 0 }}>
                  <p className="section-head__kicker">Editor</p>
                  <h2 className="section-head__title">
                    {editing ? `Editing: ${editing.title}` : "New post"}
                  </h2>
                  <p className="section-head__lede">
                    Type in plain text. Blank line starts a paragraph, <code>## </code> starts a
                    section, <code>- </code> a bullet, <code>&gt; </code> a pull quote, and{" "}
                    <code>```lang</code> a code block.
                  </p>
                </div>
                <PostEditor token={token} editing={editing} onSaved={refreshAfterWrite} />
              </section>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}