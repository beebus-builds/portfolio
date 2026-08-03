import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algorithms",
  description: "Interactive algorithm visualizer — pathfinding and sorting, live in the browser.",
};

export default function AlgorithmsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
