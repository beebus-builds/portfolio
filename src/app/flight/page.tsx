import type { Metadata } from "next";
import Link from "next/link";
import SpaceExperience from "@/components/space/SpaceExperience";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `Flight — ${profile.name}`,
  description: `Fly the ${profile.callSign} through five worlds: about, skills, projects, contact and resume. Steer with the keys, click a planet to dock.`,
};

/**
 * The untouched space-flight experience at its own address. It owns the full
 * viewport, so this page renders no navbar or footer — the floating link
 * below is the way back, visible whenever the ship is not flying.
 */
export default function FlightPage() {
  return (
    <>
      <SpaceExperience />
      <Link className="flight-home" href="/">
        ← Back to site
      </Link>
    </>
  );
}
