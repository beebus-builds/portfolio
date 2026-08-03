"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  animation?: "fade-up" | "fade-left";
  delay?: number;
}

export default function ScrollTrigger({ children, animation = "fade-up", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const animClass = {
    "fade-up": "anim-fade-up",
    "fade-left": "anim-fade-left",
  }[animation];

  return (
    <div
      ref={ref}
      className={visible ? animClass : ""}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
