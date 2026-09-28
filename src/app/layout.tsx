import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { profile } from "@/lib/profile";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const title = `${profile.name} — ${profile.role} in ${profile.location}`;
const description = `Fly the ${profile.callSign} and dock with five planets: about, skills, projects, contact and resume. An interactive WebGL portfolio by ${profile.name}, a ${profile.role} based in ${profile.location}.`;

export const metadata: Metadata = {
  metadataBase: new URL("https://bibashpoudel.dev"),
  title,
  description,
  manifest: "/manifest.webmanifest",
  applicationName: `${profile.name} — Portfolio`,
  authors: [{ name: profile.name, url: "https://bibashpoudel.dev" }],
  creator: profile.name,
  keywords: [
    profile.name,
    "creative developer",
    "full-stack developer",
    "Next.js",
    "TypeScript",
    "Three.js",
    "WebGL portfolio",
    "Nepal",
  ],
  icons: [{ rel: "icon", url: "/icons/icon.svg", type: "image/svg+xml" }],
  openGraph: {
    title,
    description,
    url: "https://bibashpoudel.dev",
    siteName: `${profile.name} — Portfolio`,
    locale: "en_US",
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: profile.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#04050c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable}`}>
        <a className="skip-link" href="#document">
          Skip the flight, read the document
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: profile.name,
              url: "https://bibashpoudel.dev",
              jobTitle: profile.role,
              email: "mailto:bibashpoudel@email.com",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Sindhuli",
                addressCountry: "NP",
              },
              sameAs: ["https://github.com/beebus-builds", "https://linkedin.com/in/bibashpoudel"],
              knowsAbout: skillsLabel(),
            }),
          }}
        />
      </body>
    </html>
  );
}

function skillsLabel() {
  return ["Next.js", "TypeScript", "React", "Three.js", "WebGL", "Node.js", "PostgreSQL", "WordPress", "PHP"];
}
