"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { profile } from "@/lib/profile";

/**
 * React error boundary for the site. If the studio scene or any of its
 * panels throw during client render, the visitor lands here instead of a blank
 * or crashed screen. "Try again" re-mounts the scene; the link walks
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
    setMessage(error.message ?? "The studio hit an unexpected error.");
  }, [error.message]);

  return (
    <SitePage hero={<PageHero kicker={`Studio systems · ${profile.name}`} title="Something broke" lede={message} />}>
        <section className="page-end">
          <div className="site-hero__actions">
          <button type="button" className="btn" onClick={() => reset()}>
            Try again
          </button>
            <Link className="btn btn--ghost" href="/">
              ← Back to the desk
            </Link>
          </div>
        </section>
    </SitePage>
  );
}
