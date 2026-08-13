"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { logoutAction } from "../logoutAction";

interface MessageItem {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact", { cache: "no-store" });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      alert("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-mono text-white">Messages</h1>
        <Link href="/admin" className="text-xs font-mono text-white/40">← Admin</Link>
      </div>

      {loading ? <p className="text-white/40">Loading...</p> : (
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="neon-card p-5 border border-white/5 rounded-xl bg-terminal-900/50">
              <p className="text-xs text-white/40">{m.name} &lt;{m.email}&gt;</p>
              <p className="text-sm text-white mt-2">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
