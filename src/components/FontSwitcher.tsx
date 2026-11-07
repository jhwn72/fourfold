"use client";
// Preview-only control so John can try clean fonts live. Saved in this browser.
// Renders inline (an "Aa" icon button with a popover below it), e.g. inside the header.
import { useEffect, useRef, useState } from "react";
import { FONT_KEY, LABEL_FONTS, TEXT_FONTS } from "./fontOptions";

type Choice = { text: string; label: string };
const DEFAULT: Choice = { text: "--font-geist-sans", label: "--font-geist-mono" };

function apply(c: Choice) {
  const s = document.documentElement.style;
  s.setProperty("--font-choice-sans", `var(${c.text})`);
  s.setProperty("--font-choice-mono", `var(${c.label})`);
}

export function FontPanel({ style }: { style?: React.CSSProperties }) {
  const [c, setC] = useState<Choice>(DEFAULT);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(FONT_KEY) || "null"); if (saved) setC(saved); } catch {}
  }, []);
  const update = (n: Choice) => { setC(n); apply(n); try { localStorage.setItem(FONT_KEY, JSON.stringify(n)); } catch {} };
  return (
    <div className="card tick" style={{ width: 250, padding: 14, background: "var(--panel)", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", textAlign: "left", ...style }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Fonts (preview)</div>
      <label className="eyebrow" style={{ display: "block", marginBottom: 4 }}>Text</label>
      <select value={c.text} onChange={(e) => update({ ...c, text: e.target.value })} style={{ width: "100%", marginBottom: 10 }}>
        {TEXT_FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <label className="eyebrow" style={{ display: "block", marginBottom: 4 }}>Labels</label>
      <select value={c.label} onChange={(e) => update({ ...c, label: e.target.value })} style={{ width: "100%", marginBottom: 10 }}>
        {LABEL_FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 300 }}>One house. Four homes.</div>
      <div className="eyebrow" style={{ marginTop: 4 }}>Parcel 144-372-04 · 4 homes</div>
      <button type="button" onClick={() => update(DEFAULT)} style={{ marginTop: 10, padding: "4px 10px", fontSize: 12 }}>Reset</button>
    </div>
  );
}

export default function FontSwitcher() {
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
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Fonts" aria-expanded={open} title="Fonts" className="iconbtn">Aa</button>
      {open && <FontPanel style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 60, margin: 0 }} />}
    </div>
  );
}
