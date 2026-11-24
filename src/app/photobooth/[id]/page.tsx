import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { normaliseCode } from "@/lib/photobooth";
import PhoneCamera from "./PhoneCamera";

export const metadata: Metadata = {
  title: "You're the camera — Bibash Poudel",
  description: "Your phone is connected to the studio photobooth. Snap a few shots and they'll show up on the big screen.",
  robots: { index: false, follow: false },
};

export default async function PhonePhotoboothPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = normaliseCode(rawId);
  // A code is 8 characters; anything else can't be a real room.
  if (id.length !== 8) notFound();
  return <PhoneCamera id={id} />;
}