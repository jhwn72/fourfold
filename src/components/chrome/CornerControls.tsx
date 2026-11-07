"use client";
// Bottom corners, as on the landing: a Dark | Light pill on the left, the Aa font control on the right.
import { useEffect, useRef, useState } from "react";
import { FontPanel } from "../FontSwitcher";
import { setTheme, useTheme } from "../theme";
import s from "./chrome.module.css";

export function ThemePill({ className = "" }: { className?: string }) {
  const theme = useTheme();
  return (
    <div className={`${s.toggle} ${className}`} role="group" aria-label="Theme">
      <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</button>
      <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Light</button>
    </div>
  );
}

export function FontCorner() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={ref} className={s.fontCorner}>
      {open && <FontPanel style={{ position: "absolute", bottom: "calc(100% + 8px)", right: 0, zIndex: 60, margin: 0, borderRadius: 16 }} />}
      <button type="button" className={s.aa} onClick={() => setOpen((o) => !o)} aria-label="Fonts" aria-expanded={open} title="Fonts">Aa</button>
    </div>
  );
}

export default function CornerControls() {
  return (
    <div className={s.corners}>
      <ThemePill className={s.cornerLeft} />
      <FontCorner />
    </div>
  );
}
