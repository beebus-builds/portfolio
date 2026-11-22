import type { Metadata } from "next";
import Studio from "@/components/studio/Studio";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role} in ${profile.location}`,
  description:
    "Step into the studio of Bibash Poudel, a creative developer working across Next.js, TypeScript, WordPress and 3D on the web.",
};

export default function Home() {
  return (
    <main className="studio-main" id="document">
      <h1 className="sr-only">
        {profile.name} — {profile.role}. An interactive studio: click the poster, bookshelf, monitor,
        phone, notebook, window or desk lamp in the room to move around.
      </h1>
      <Studio />
    </main>
  );
}
