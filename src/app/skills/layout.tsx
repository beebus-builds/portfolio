import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills",
  description: "Technologies, tools, and languages I use.",
};

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
