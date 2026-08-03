import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guestbook",
  description: "Leave a message, say hello, or just pass by.",
};

export default function GuestbookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
