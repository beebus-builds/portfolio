"use client";

import { useEffect } from "react";
import { initTheme } from "@/lib/themes";

export default function ThemeInit() {
  useEffect(() => {
    initTheme();
  }, []);
  return null;
}
