"use client";
import { setTheme, useTheme } from "./theme";

export default function ThemeToggle() {
  const t = useTheme();
  const next = t === "dark" ? "light" : "dark";
  return (
    <button type="button" className="theme-toggle" onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {t === "dark" ? "Light" : "Dark"}
    </button>
  );
}
