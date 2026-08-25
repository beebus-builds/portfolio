"use client";

import { useEffect, useState } from "react";
import { playTick } from "@/lib/audio";

interface TelemetryData {
  status: string;
  dbProvider: string;
  latencyMs: number;
  metrics: {
    blogPosts: number;
    inboxMessages: number;
    activeProjects: number;
    totalBlogViews: number;
  };
  timestamp: string;
}

export default function DatabaseTelemetry() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<number[]>([15, 22, 18, 30, 25, 20, 28, 22, 19, 24]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/telemetry");
      const json = await res.json();
      setData(json);
      setLoading(false);
      // Append latency to history graph
      setHistory((prev) => [...prev.slice(-15), json.latencyMs || Math.floor(Math.random() * 15) + 12]);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="term-window overflow-hidden">
      <div className="term-titlebar bg-terminal-950/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-path">~/db_telemetry.node</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400">CONNECTED</span>
        </div>
      </div>

      <div className="term-body p-6 bg-terminal-950/30">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Database Provider</p>
            <p className="text-sm font-mono font-bold text-white mt-0.5">{data?.dbProvider || "Neon Postgres"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Query Latency</p>
            <p className="text-sm font-mono font-bold text-neon-400 mt-0.5">
              {loading ? "..." : `${data?.latencyMs ?? 18}ms`}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
            <p className="text-[10px] font-mono text-white/30">POSTS</p>
            <p className="text-xl font-mono font-bold text-white mt-1">
              {loading ? "..." : data?.metrics.blogPosts}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
            <p className="text-[10px] font-mono text-white/30">INBOX</p>
            <p className="text-xl font-mono font-bold text-neon-400 mt-1">
              {loading ? "..." : data?.metrics.inboxMessages}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
            <p className="text-[10px] font-mono text-white/30">PROJECTS</p>
            <p className="text-xl font-mono font-bold text-white mt-1">
              {loading ? "..." : data?.metrics.activeProjects}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
            <p className="text-[10px] font-mono text-white/30">TOTAL VIEWS</p>
            <p className="text-xl font-mono font-bold text-amber-400 mt-1">
              {loading ? "..." : data?.metrics.totalBlogViews}
            </p>
          </div>
        </div>

        {/* Live Throughput Oscilloscope Wave */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono text-white/30 mb-2">
            <span>LIVE THROUGHPUT PLOTTER (SQL READ/WRITE)</span>
            <span>FREQ: 6s POLLING</span>
          </div>
          <div className="h-16 w-full bg-terminal-900/80 rounded-lg border border-white/5 p-2 flex items-end gap-1.5 overflow-hidden">
            {history.map((val, idx) => {
              const heightPercent = Math.min(100, Math.max(15, (val / 60) * 100));
              return (
                <div
                  key={idx}
                  onMouseEnter={playTick}
                  className="flex-1 bg-neon-400/20 hover:bg-neon-400 rounded-t transition-all duration-300 relative group cursor-pointer"
                  style={{ height: `${heightPercent}%` }}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-terminal-900 text-neon-400 text-[9px] px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    {val}ms
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
