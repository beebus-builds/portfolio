"use client";

export default function MouseScroll() {
  const scrollToTerminal = () => {
    const terminal = document.getElementById("terminal");
    if (terminal) {
      terminal.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div 
      className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer group" 
      onClick={scrollToTerminal}
    >
      <div className="w-6 h-10 border-2 border-[var(--color-terminal-text)] rounded-full p-1 flex justify-center group-hover:border-[var(--color-neon-400)] transition-colors">
        <div className="w-1.5 h-2 bg-[var(--color-terminal-text)] rounded-full animate-bounce group-hover:bg-[var(--color-neon-400)] transition-colors" />
      </div>
    </div>
  );
}
