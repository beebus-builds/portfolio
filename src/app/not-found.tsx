import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-900 font-mono">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-8">
          <span className="text-4xl text-neon-400/30">4</span>
          <span className="shape-line mx-3" style={{ width: 20 }} />
          <span className="text-4xl text-neon-400/30">4</span>
        </div>
        <h1 className="text-5xl font-mono text-white tracking-tight mb-4">
          command not found
        </h1>
        <p className="text-sm font-mono text-white/40 mb-8 max-w-md mx-auto">
          This page doesn&apos;t exist. But the portfolio has more routes —
          try exploring the pages linked below or type a command in the terminal.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/" className="btn-neon text-xs">Home</Link>
          <Link href="/projects" className="btn-ghost text-xs">Projects</Link>
          <Link href="/blog" className="btn-ghost text-xs">Blog</Link>
        </div>
      </div>
    </div>
  );
}