import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortfolioWorldLoader from "@/components/world/PortfolioWorldLoader";

export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/blog", label: "Notes" },
  { href: "/education", label: "Education" },
  { href: "/contact", label: "Contact" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#05040a]">
      <Header />
      <main id="main-content" className="flex-1">
        <PortfolioWorldLoader />
        <noscript>
          <div className="world-fallback">
            <span className="world-hud-kicker">BIBASH POUDEL</span>
            <h1>Build. Better.</h1>
            <p>Web developer building interfaces, systems and digital products.</p>
            <nav>
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label} →
                </Link>
              ))}
            </nav>
          </div>
        </noscript>
      </main>
      <Footer />
    </div>
  );
}
