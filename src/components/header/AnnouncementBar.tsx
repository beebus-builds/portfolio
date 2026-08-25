"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  color: string;
  cover: string | null;
  readingTime: number;
}

const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop",
];

export default function AnnouncementBar() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hidden, setHidden] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      const h = localStorage.getItem("announcement_hidden");
      if (h === "true") setHidden(true);
    } catch {}
    // fetch latest blogs
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data?.posts?.length) {
          // take latest 5, sorted by date desc already
          setPosts(data.posts.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    setHidden(true);
    try { localStorage.setItem("announcement_hidden", "true"); } catch {}
  };

  if (hidden) {
    return (
      <button
        onClick={() => { setHidden(false); try { localStorage.removeItem("announcement_hidden"); } catch {} }}
        className="w-full h-7 flex items-center justify-center gap-1.5 bg-neon-400/5 border-y border-neon-400/10 text-[10px] font-mono tracking-widest text-neon-400/70 hover:text-neon-400 hover:bg-neon-400/10 transition-colors cursor-pointer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-neon-400 animate-pulse" />
        Show announcements
      </button>
    );
  }

  // Build marquee items: mix of blogs + static announcements
  const staticAnnouncements: Post[] = [
    {
      slug: "contact",
      title: "Available for internships — avg reply within a day",
      excerpt: "Let's build something together",
      date: new Date().toISOString().split("T")[0],
      tags: ["Hiring"],
      color: "#54e6d4",
      cover: null,
      readingTime: 1,
    },
  ];

  const items: (Post & { href: string; label: string })[] = [
    ...posts.map((p, i) => ({
      ...p,
      href: `/blog/${p.slug}`,
      label: "NEW BLOG",
      cover: p.cover || FALLBACK_COVERS[i % FALLBACK_COVERS.length],
    })),
    ...staticAnnouncements.map((p) => ({ ...p, href: `/${p.slug}`, label: "ANNOUNCEMENT", cover: FALLBACK_COVERS[0] })),
  ];

  // duplicate for seamless loop
  const marqueeItems = [...items, ...items, ...items];

  if (items.length === 0) return null;

  return (
    <div className="relative w-full border-y border-neon-400/15 bg-terminal-800/90 backdrop-blur-md overflow-hidden group/announce"
         onMouseEnter={() => setPaused(true)}
         onMouseLeave={() => setPaused(false)}
    >
      {/* accent top line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-400/40 to-transparent" />
      
      <div className="flex items-stretch">
        {/* Left badge — stays fixed */}
        <div className="hidden sm:flex items-center gap-2.5 px-5 shrink-0 bg-neon-400 text-terminal-900 font-mono font-bold tracking-widest text-[11px] relative">
          <span className="w-2 h-2 rounded-full bg-terminal-900 animate-pulse" />
          LATEST
          <span className="hidden lg:inline opacity-60">•</span>
          <span className="hidden lg:inline text-[10px] font-normal opacity-70">Announcements</span>
          {/* chevron separator */}
          <div className="absolute -right-[12px] top-0 bottom-0 w-3 overflow-hidden hidden sm:block">
            <div className="absolute inset-0 bg-neon-400" style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
          </div>
        </div>

        {/* Marquee track */}
        <div className="flex-1 relative overflow-hidden py-3">
          <div
            className={`flex items-center gap-4 w-max will-change-transform ${paused ? "[animation-play-state:paused]" : ""}`}
            style={{
              animation: "announce-marquee 45s linear infinite",
            }}
          >
            {marqueeItems.map((item, idx) => (
              <Link
                key={`${item.slug}-${idx}`}
                href={item.href}
                className="flex items-center gap-3 shrink-0 group/item pr-4 border-r border-white/10 last:border-0 hover:opacity-90 transition-opacity"
              >
                {/* image alongside */}
                <div className="relative w-[52px] h-[52px] rounded-lg overflow-hidden shrink-0 border border-white/10 group-hover/item:border-neon-400/30 transition-colors bg-terminal-700">
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: `${item.color}18` }}>
                      <span className="font-mono font-bold text-xs" style={{ color: item.color }}>{item.title.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </div>

                <div className="min-w-0 max-w-[320px]">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neon-400 text-terminal-900 tracking-wider">
                      {item.label}
                    </span>
                    <span className="text-[9px] font-mono text-white/30 hidden sm:inline">
                      {item.date} • {item.readingTime} min
                    </span>
                    {item.tags?.[0] && (
                      <span className="hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/40 bg-white/[0.03]">
                        {item.tags[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-mono font-bold text-white group-hover/item:text-neon-400 transition-colors leading-tight truncate pr-2">
                    {item.title}
                  </p>
                  <p className="text-[11px] font-mono text-white/40 leading-tight truncate max-w-[300px] hidden sm:block">
                    {item.excerpt}
                  </p>
                </div>

                <span className="hidden sm:flex w-6 h-6 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white/30 group-hover/item:bg-neon-400 group-hover/item:text-terminal-900 group-hover/item:border-neon-400 transition-all shrink-0">
                  <span className="text-[11px]">↗</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-1 px-3 shrink-0 border-l border-white/10 bg-terminal-900/50">
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play announcements" : "Pause announcements"}
            className="w-7 h-7 rounded-md border border-white/10 bg-white/[0.03] text-white/40 hover:text-white hover:border-white/20 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 cursor-pointer"
            title={paused ? "Play" : "Pause"}
          >
            {paused ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v14l11-7z" /></svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            )}
          </button>
          <button
            onClick={handleClose}
            aria-label="Dismiss announcements"
            className="w-7 h-7 rounded-md border border-white/10 bg-white/[0.03] text-white/30 hover:text-red-400 hover:border-red-400/20 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400/30 cursor-pointer"
            title="Dismiss"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-400/10 to-transparent" />
    </div>
  );
}
