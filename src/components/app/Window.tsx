"use client";
// An expandable window over the app (Tango sheet: dims and blurs what is behind it). Esc or × closes it.
// Motion: the window grows from the button that opened it and shrinks back into it on close.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "../viz/useReducedMotion";

const EASE_OUT = "cubic-bezier(0.2, 0.6, 0.2, 1)", EASE_IN = "cubic-bezier(0.4, 0, 0.9, 0.5)";

export default function Window({ title, onClose, children, size = "lg" }: { title: string; onClose: () => void; children: React.ReactNode; size?: "sm" | "lg" }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const [closing, setClosing] = useState(false);

  // Transform that maps the window onto the opener's rect (FLIP).
  const fromOpener = () => {
    const o = openerRef.current, c = cardRef.current;
    if (!o || !c || !o.isConnected) return null;
    const a = o.getBoundingClientRect(), b = c.getBoundingClientRect();
    if (!a.width || !b.width) return null;
    return `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
  };

  useLayoutEffect(() => {
    // Focus moves into the window and returns to whatever opened it on close.
    const opener = document.activeElement as HTMLElement | null;
    openerRef.current = opener && opener !== document.body ? opener : null;
    const c = cardRef.current;
    c?.getAnimations?.().forEach((x) => x.cancel()); // measure the untransformed card (dev double effects)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(window.location.search).get("motion") === "0";
    const tf = reduce ? null : fromOpener();
    if (c && tf && c.animate) {
      c.style.transformOrigin = "top left";
      c.animate([{ transform: tf, opacity: 0.4 }, { transform: "none", opacity: 1 }], { duration: 450, easing: EASE_OUT });
    }
    closeRef.current?.focus();
    return () => opener?.focus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closing) return;
    const c = cardRef.current;
    const tf = reducedRef.current ? null : fromOpener();
    if (!c || !tf) { onClose(); return; }
    setClosing(true);
    c.style.transformOrigin = "top left";
    const anim = c.animate?.([{ transform: "none", opacity: 1 }, { transform: tf, opacity: 0 }], { duration: 300, easing: EASE_IN, fill: "forwards" });
    let done = false;
    const finish = () => { if (!done) { done = true; onClose(); } };
    anim?.finished.then(finish, finish);
    setTimeout(finish, 350);
  }, [closing, onClose]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [close]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={close} className={`ff-scrim${closing ? " ff-closing" : ""}`}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 16 }}>
      <div ref={cardRef} className="card ff-win" onClick={(e) => e.stopPropagation()}
        style={{ margin: 0, width: size === "sm" ? "min(720px, 100%)" : "min(1040px, 100%)", maxHeight: "min(86vh, 900px)", overflow: "auto", padding: "18px 22px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: -18, background: "var(--glass-strong)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "6px 0 10px", zIndex: 1, borderBottom: "1px solid var(--line)", marginBottom: 12 }}>
          <span className="eyebrow">{title}</span>
          <button ref={closeRef} type="button" onClick={close} className="iconbtn" aria-label="Close window">×</button>
        </div>
        <div className="ff-win-body">{children}</div>
      </div>
    </div>
  );
}
