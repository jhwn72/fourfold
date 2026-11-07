"use client";
// A number that ticks up to its value (from 0 on first show, from the old value when it changes).
// Reduced motion shows the final value.
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../viz/useReducedMotion";

export default function Tick({ value, ms = 750, prefix = "", suffix = "" }: { value: number; ms?: number; prefix?: string; suffix?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(0); // where the next animation starts: whatever is on screen now
  useEffect(() => {
    if (reduced) { setShown(value); from.current = value; return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const v = Math.round(a + (value - a) * e);
      from.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduced]);
  return <span className="num">{prefix}{shown.toLocaleString("en-US")}{suffix}</span>;
}
