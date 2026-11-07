"use client";
// An expandable window over the app (Tango sheet: dims and blurs what is behind it). Esc or × closes it.
import { useEffect, useRef } from "react";

export default function Window({ title, onClose, children, size = "lg" }: { title: string; onClose: () => void; children: React.ReactNode; size?: "sm" | "lg" }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Focus moves into the window and returns to whatever opened it on close.
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 16 }}>
      <div className="card ff-win" onClick={(e) => e.stopPropagation()}
        style={{ margin: 0, width: size === "sm" ? "min(720px, 100%)" : "min(1040px, 100%)", maxHeight: "min(86vh, 900px)", overflow: "auto", padding: "18px 22px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: -18, background: "var(--glass-strong)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "6px 0 10px", zIndex: 1, borderBottom: "1px solid var(--line)", marginBottom: 12 }}>
          <span className="eyebrow">{title}</span>
          <button ref={closeRef} type="button" onClick={onClose} className="iconbtn" aria-label="Close window">×</button>
        </div>
        <div className="ff-win-body">{children}</div>
      </div>
    </div>
  );
}
