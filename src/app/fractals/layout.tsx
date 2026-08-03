import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fractals",
  description: "Interactive Mandelbrot and Julia set explorer rendered live in the browser.",
};

export default function FractalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
