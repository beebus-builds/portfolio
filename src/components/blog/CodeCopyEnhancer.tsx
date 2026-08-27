"use client";

import { useEffect } from "react";

export default function CodeCopyEnhancer() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.classList.contains("copy-btn")) return;
      const block = target.closest(".code-block");
      const code = block?.querySelector("code");
      if (!code) return;
      const text = code.textContent || "";
      navigator.clipboard?.writeText(text).then(() => {
        target.textContent = "Copied!";
        target.classList.add("copied");
        setTimeout(() => {
          target.textContent = "Copy";
          target.classList.remove("copied");
        }, 1800);
      }).catch(() => {});
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
