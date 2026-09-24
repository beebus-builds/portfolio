import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bibashpoudel.dev"),
  title: "PROJECT ORBITAL — Bibash Poudel",
  description: "An orbital developer station by Bibash Poudel. Explore missions, skills, and systems from a builder in Nepal.",
  manifest: "/manifest.webmanifest",
  keywords: ["Bibash Poudel", "creative developer", "full-stack developer", "Nepal", "portfolio", "Three.js"],
  icons: [{ rel: "icon", url: "/icons/icon.svg", type: "image/svg+xml" }],
  openGraph: {
    title: "PROJECT ORBITAL — Bibash Poudel",
    description: "An orbital developer station by Bibash Poudel.",
    url: "https://bibashpoudel.dev",
    siteName: "PROJECT ORBITAL",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630, alt: "PROJECT ORBITAL — Bibash Poudel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PROJECT ORBITAL — Bibash Poudel",
    description: "An orbital developer station by Bibash Poudel.",
    images: ["/og"],
  },
  applicationName: "PROJECT ORBITAL",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PROJECT ORBITAL",
  },
};

export const viewport: Viewport = {
  themeColor: "#05080d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable}`}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Bibash Poudel",
              url: "https://bibashpoudel.dev",
              jobTitle: "Creative developer",
              address: { "@type": "PostalAddress", addressCountry: "NP", addressLocality: "Sindhuli" },
              knowsAbout: ["Next.js", "TypeScript", "Three.js", "Full-stack development", "WordPress"],
            }),
          }}
        />
      </body>
    </html>
  );
}
