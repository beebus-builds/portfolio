import type { Metadata, Viewport } from "next";
import { Anonymous_Pro } from "next/font/google";
import "./globals.css";

const anonPro = Anonymous_Pro({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-anon",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bibashpoudel.dev"),
  title: "Bibash Poudel — Nepal Dev Terminal",
  description: "Interactive CLI portfolio of Bibash Poudel. A terminal-inspired portfolio with WebRTC calls, virtual filesystem, and Nepali dev identity.",
  manifest: "/manifest.webmanifest",
  keywords: ["Bibash Poudel", "developer", "Nepal", "Nepali developer", "full-stack", "WordPress", "portfolio"],
  icons: [
    { rel: "icon", url: "/icons/icon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/icons/icon.svg" },
  ],
  openGraph: {
    title: "Bibash Poudel — Nepal Dev Terminal",
    description: "Developer from Sindhuli, Nepal. A terminal-inspired portfolio.",
    url: "https://bibashpoudel.dev",
    siteName: "Bibash Poudel",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og?type=home&title=Bibash%20Poudel", width: 1200, height: 630, alt: "Bibash Poudel — DevVerse" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bibash Poudel — Nepal Dev Terminal",
    description: "Developer from Sindhuli, Nepal. A terminal-inspired portfolio.",
    images: ["/og?type=home&title=Bibash%20Poudel"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nepal Dev",
  },
  applicationName: "Nepal Dev Terminal",
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import CommandPalette from "@/components/CommandPalette";
import CursorGlow from "@/components/CursorGlow";
import StudentWorkspaceBar from "@/components/StudentWorkspaceBar";
import PageTransition from "@/components/PageTransition";
import ThemeInit from "@/components/ThemeInit";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className={`${anonPro.variable} grain`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Bibash Poudel",
              url: "https://bibashpoudel.dev",
              jobTitle: "Developer",
              address: { "@type": "PostalAddress", addressCountry: "NP", addressLocality: "Sindhuli" },
              knowsAbout: ["Next.js", "TypeScript", "WordPress", "Full-Stack Development"],
            }),
          }}
        />
        <CursorGlow />
        <ThemeInit />
        <main id="main-content" className="pb-8" tabIndex={-1}>
          <PageTransition>{children}</PageTransition>
        </main>
        <StudentWorkspaceBar />
        <CommandPalette />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
