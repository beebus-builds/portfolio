import type { Metadata } from "next";
import SpaceExperience from "@/components/space/SpaceExperience";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role} in ${profile.location}`,
  description:
    "An interactive WebGL portfolio you fly. Steer the ship, dock with five worlds, " +
    "and read each section as a planet: about, skills, projects, contact and resume.",
};

/**
 * The site is the flight. There is no landing page to scroll past — the canvas
 * is the interface, and every section lives on a planet you dock with.
 *
 * Deep links such as `/?planet=projects` fly straight to that world, which is
 * what the footer, nav and manifest shortcuts all point at.
 */
export default function Home() {
  return <SpaceExperience />;
}
