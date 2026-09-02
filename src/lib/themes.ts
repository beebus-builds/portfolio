"use client";

export type ThemeName = "cyber" | "matrix" | "dracula" | "amber" | "magenta";

interface ThemeDef {
  label: string;
  accent: string;
  secondary: string;
}

export const THEMES: Record<ThemeName, ThemeDef> = {
  cyber: { label: "Cyber Cyan", accent: "#54e6d4", secondary: "#4af0ff" },
  matrix: { label: "Matrix Green", accent: "#00ff41", secondary: "#4af0ff" },
  dracula: { label: "Dracula Purple", accent: "#bd93f9", secondary: "#ff79c6" },
  amber: { label: "Amber Terminal", accent: "#ffb86c", secondary: "#ffd700" },
  magenta: { label: "Magenta Dream", accent: "#ff4af0", secondary: "#ffd700" },
};

const STORAGE_KEY = "sys_theme";

let currentTheme: ThemeName = "cyber";

if (typeof window !== "undefined") {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
  if (saved && THEMES[saved]) currentTheme = saved;
}

export function applyTheme(name: ThemeName) {
  if (typeof window === "undefined" || !THEMES[name]) return;
  const root = document.documentElement;
  const def = THEMES[name];
  root.setAttribute("data-theme", name);
  root.style.setProperty("--color-neon-400", def.accent);
  root.style.setProperty("--color-cyan-400", def.secondary);
  root.style.setProperty("--accent", def.accent);
  localStorage.setItem(STORAGE_KEY, name);
  currentTheme = name;
  window.dispatchEvent(new CustomEvent("theme-change", { detail: { name, accent: def.accent } }));
}

export function getTheme(): ThemeName {
  return currentTheme;
}

export function initTheme() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
  if (saved && THEMES[saved]) applyTheme(saved);
}
