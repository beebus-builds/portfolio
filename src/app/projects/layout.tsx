import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I've built — full-stack apps, WordPress themes, and tools.",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
