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
  title: "Bibash Poudel — Nepal Dev Terminal",
  description: "Interactive CLI portfolio of Bibash Poudel. A terminal-inspired portfolio with WebRTC calls, virtual filesystem, and Nepali dev identity.",
  manifest: "/manifest.webmanifest",
  keywords: ["Bibash Poudel", "developer", "Nepal", "Nepali developer", "full-stack", "WordPress", "portfolio"],
  openGraph: {
    title: "Bibash Poudel — Nepal Dev Terminal",
    description: "Developer from Sindhuli, Nepal. A terminal-inspired portfolio.",
    url: "https://bibashpoudel.dev",
    siteName: "Bibash Poudel",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Bibash Poudel — Nepal Dev Terminal",
    description: "Developer from Sindhuli, Nepal. A terminal-inspired portfolio.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={anonPro.variable}>
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
        <div className="pb-8">
          {children}
        </div>
        <StudentWorkspaceBar />
        <CommandPalette />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
