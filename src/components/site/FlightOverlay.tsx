"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SpaceExperience from "@/components/space/SpaceExperience";

/**
 * Fullscreen flight overlay for the classic pages. It mounts the untouched
 * space-flight experience only when the URL asks for it (`?planet=` deep
 * links or `?flight=1`), so the 2D site stays fast and the old links keep
 * working. Rendered last in the DOM so it paints above the navbar.
 */
function FlightOverlayInner() {
  const params = useSearchParams();
  const active = params.get("planet") !== null || params.get("flight") !== null;
  if (!active) return null;

  return (
    <div className="flight-overlay">
      <SpaceExperience />
      <Link className="flight-home" href="/">
        ← Back to site
      </Link>
    </div>
  );
}

export default function FlightOverlay() {
  return (
    <Suspense fallback={null}>
      <FlightOverlayInner />
    </Suspense>
  );
}
