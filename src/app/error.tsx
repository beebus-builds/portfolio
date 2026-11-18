"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNavbar from "@/components/site/SiteNavbar";
import SiteFooter from "@/components/site/SiteFooter";
import { profile } from "@/lib/profile";

/**
 * React error boundary for the city sim. If the simulation or any of its
 * panels throw during client render, the visitor lands here instead of a blank
 * or crashed screen. "Rebuild the city" re-mounts the scene; the link walks
 * back to the document view.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(error.message ?? "The city sim encountered an error.");
  }, [error.message]);

  return (
    <div className="site" role="region" aria-label="Error recovery">
      <SiteNavbar />
      <main className="site__main" id="document">
        <header className="page-hero">
          <p className="section-head__kicker">City systems · {profile.name}</p>
          <h1>Grid failure</h1>
          <p className="page-hero__lede">{message}</p>
        </header>
        <section className="site-section">
          <button type="button" className="btn" onClick={() => reset()}>
            Rebuild the city
          </button>
          <Link className="text-link" href="/">
            Return to the city ↗
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
