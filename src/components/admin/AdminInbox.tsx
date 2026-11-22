"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Message = { id: number; name: string; email: string; message: string; created_at: string };

const TOKEN_KEY = "admin_token";

function readToken(): string {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function AdminInbox() {
  const [token, setToken] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (value: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/messages?limit=100", {
        headers: { Authorization: `Bearer ${value}` },
        cache: "no-store",
      });
      if (response.status === 401) {
        setError("That token was not accepted.");
        setMessages(null);
        setToken("");
        try {
          window.sessionStorage.removeItem(TOKEN_KEY);
        } catch {
          /* storage optional */
        }
        return;
      }
      const data = (await response.json()) as { messages?: Message[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load messages.");
      setMessages(data.messages ?? []);
      setToken(value);
      try {
        window.sessionStorage.setItem(TOKEN_KEY, value);
      } catch {
        /* storage optional: you'll just be asked again next visit */
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = readToken();
    if (saved) void load(saved);
  }, [load]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim()) void load(draft.trim());
    setDraft("");
  };

  if (!token) {
    return (
      <section className="site-section">
        <form className="admin-login" onSubmit={submit}>
          <label htmlFor="admin-token">Admin token</label>
          <input
            id="admin-token"
            type="password"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="current-password"
          />
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Checking…" : "Unlock"}
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      </section>
    );
  }

  return (
    <section className="site-section">
      <div className="admin-bar">
        <p>{messages ? `${messages.length} message${messages.length === 1 ? "" : "s"}` : "Loading…"}</p>
        <button type="button" className="btn" onClick={() => void load(token)} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {messages?.length === 0 && <p>No messages yet.</p>}
      <ul className="admin-list">
        {messages?.map((message) => (
          <li key={message.id} className="site-card">
            <header>
              <b>{message.name}</b> ·{" "}
              <a className="text-link" href={`mailto:${message.email}`}>
                {message.email}
              </a>
              <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time>
            </header>
            <p>{message.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
