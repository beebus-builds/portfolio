import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Props {
  children: React.ReactNode;
}

export default function PageShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-terminal-900 flex flex-col modern-site-shell">
      <div className="site-atmosphere" aria-hidden="true">
        <span className="site-atmosphere-orb site-atmosphere-orb-a" />
        <span className="site-atmosphere-orb site-atmosphere-orb-b" />
        <span className="site-grid" />
      </div>
      <Header />
      <main id="main-content" className="flex-1 relative z-[2]">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 modern-page-content">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
