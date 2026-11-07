"use client";
import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
export const THEME_KEY = "fourfold-theme";

/** Current theme from <html data-theme>, kept in sync when the toggle changes it. */
export function useTheme(): Theme {
  const [t, setT] = useState<Theme>("light");
  useEffect(() => {
    const read = () => setT(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return t;
}

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(THEME_KEY, t); } catch {}
}
