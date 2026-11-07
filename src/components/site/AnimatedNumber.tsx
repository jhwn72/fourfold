"use client";
// The price tag dividing: counts from the asking price down to the per-home figure.
import { useEffect, useState } from "react";
import { useReducedMotion } from "../viz/useReducedMotion";

export default function AnimatedNumber({ from, to, delayMs = 300, durationMs = 1400 }: { from: number; to: number; delayMs?: number; durationMs?: number }) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(from);
  useEffect(() => {
    if (reduced) { setV(to); return; }
    let raf = 0;
    const t0 = performance.now() + delayMs;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / durationMs));
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(from + (to - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, delayMs, durationMs, reduced]);
  return <span className="num">${v.toLocaleString("en-US")}</span>;
}
