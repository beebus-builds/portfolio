"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNavbar from "@/components/site/SiteNavbar";
import SiteFooter from "@/components/site/SiteFooter";
import { profile } from "@/lib/profile";

/**
 * React error boundary for the flight deck. If the 3D cockpit or any of its
 * panels throw during client render, the visitor lands here instead of a blank
 * or crashed screen. "Reset the flight" re-mounts the scene; the link walks
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
    setMessage(error.message ?? "The cockpit encountered an error.");
  }, [error.message]);

  return (
    <div className="site" role="region" aria-label="Error recovery">
      <SiteNavbar />
      <main className="site__main" id="document">
        <header className="page-hero">
          <p className="section-head__kicker">Flight systems · {profile.callSign}</p>
          <h1>Instrument failure</h1>
          <p className="page-hero__lede">{message}</p>
        </header>
        <section className="site-section">
          <button type="button" className="btn" onClick={() => reset()}>
            Reset the flight
          </button>
          <Link className="text-link" href="/">
            Return to the ship ↗
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
