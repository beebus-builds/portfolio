import type { Metadata } from "next";
import Photobooth from "./Photobooth";

export const metadata: Metadata = {
  title: "Photobooth — Bibash Poudel",
  description: "Scan the QR code with your phone to turn it into a camera and snap a few shots in the studio.",
  alternates: { canonical: "/photobooth" },
  robots: { index: false, follow: false },
};

export default function PhotoboothPage() {
  return <Photobooth />;
}