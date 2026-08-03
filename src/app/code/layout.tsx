import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code",
  description: "Code snippets and patterns I'm proud of.",
};

export default function CodeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
