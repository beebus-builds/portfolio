import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command Playground",
  description: "An interactive terminal to explore the portfolio.",
};

export default function CommandsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
