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

/** Seconds since a shared performance.now() start, ticking with rAF until `until` seconds, then holding. */
export function useClock(startAt: number | null, until = 4) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(() => (startAt == null ? until : 0));
  useEffect(() => {
    if (reduced || startAt == null) { setT(until); return; }
    let raf = 0;
    const tick = (now: number) => {
      const s = Math.max(0, (now - startAt) / 1000);
      setT(Math.min(until, s));
      if (s < until) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startAt, until, reduced]);
  return t;
}

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
// Same beats as the lot particles (LOT_BEATS in viz/LotParticles.tsx).
const B = { split: 1.25, rise: 2.5, part: 1.9, homesDone: 3.55, fourth: 3.3 };

/** Per home on the lot clock. Split lots: asking, then asking ÷ 2 as the split line draws and the lots part
 *  (the investor figure), then the true per-home figure as the last home rises. Other lots divide during assembly. */
export function perHomeAt(t: number, asking: number, final: number, split: boolean) {
  if (!split) return Math.round(asking + (final - asking) * ease((t - 0.3) / 1.3));
  const half = asking / 2;
  if (t < B.rise) return Math.round(asking + (half - asking) * ease((t - B.split) / (B.rise - B.split)));
  return Math.round(half + (final - half) * ease((t - B.rise) / (B.homesDone - B.rise)));
}
export function homesAt(t: number, final: number, split: boolean) {
  if (!split) return final;
  return t < B.part ? 1 : t < B.fourth ? 2 : final;
}

/** The site card's Homes and Per home, driven by the same clock as the lot. aria-label carries the final value. */
export function LotNumbers({ startAt, asking, perHome, homes, split, children }: { startAt: number | null; asking: number | null; perHome: number | null; homes: number | null; split: boolean; children: (v: { homes: React.ReactNode; perHome: React.ReactNode }) => React.ReactNode }) {
  const t = useClock(startAt);
  const h = homes == null ? "UNKNOWN" : <span className="num" aria-label={String(homes)}>{homesAt(t, homes, split)}</span>;
  const p = homes === 0 ? "n/a" : asking && perHome ? <span className="num" aria-label={"$" + perHome.toLocaleString("en-US")}>${perHomeAt(t, asking, perHome, split).toLocaleString("en-US")}</span> : "UNKNOWN";
  return <>{children({ homes: h, perHome: p })}</>;
}
