"use client";
import { setTheme, useTheme } from "./theme";

/** Theme switch. `variant="icon"` renders a square header button with a sun/moon glyph. */
export default function ThemeToggle({ variant = "text" }: { variant?: "text" | "icon" }) {
  const t = useTheme();
  const next = t === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;
  if (variant === "icon") {
    return (
      <button type="button" className="iconbtn" onClick={() => setTheme(next)} aria-label={label} title={label}>
        <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>{t === "dark" ? "☀" : "☾"}</span>
      </button>
    );
  }
  return (
    <button type="button" className="theme-toggle" onClick={() => setTheme(next)} aria-label={label} title={label}>
      {t === "dark" ? "Light" : "Dark"}
    </button>
  );
}
