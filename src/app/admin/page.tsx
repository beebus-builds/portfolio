"use client";

import { useState } from "react";
import SiteNavbar from "@/components/site/SiteNavbar";
import SiteFooter from "@/components/site/SiteFooter";

type Message = { id: number; name: string; email: string; message: string; created_at: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messages", {
        headers: { authorization: `Bearer ${token}` },
      });
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

  return (
    <div className="site">
      <SiteNavbar />
      <main className="site__main" id="document">
        <header className="page-hero">
          <p className="section-head__kicker">Restricted</p>
          <h1>Mission inbox</h1>
          <p className="page-hero__lede">Messages from the contact channel, newest first.</p>
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
              {loading ? "Loading…" : "Open inbox"}
            </button>
          </form>
          {error && <p role="alert">{error}</p>}
          {messages &&
            (messages.length === 0 ? (
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
            ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
