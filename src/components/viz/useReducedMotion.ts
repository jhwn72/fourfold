"use client";
import { useEffect, useState } from "react";
/** True when the OS asks for reduced motion, or the URL has ?motion=0 (venue machine). */
export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const off = new URLSearchParams(window.location.search).get("motion") === "0";
    setR(m.matches || off);
    const f = () => setR(m.matches || off);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

/** Time-based lerp factor: k = 1 - exp(-dt / tau). Same settle time at any frame rate. dt and tau in seconds. */
export function lerpK(dt: number, tau: number) {
  return 1 - Math.exp(-Math.min(0.05, dt) / tau);
}

/** Camera settle constant: equals k = 0.06 per frame at 60 fps, about 95% settled in 0.8 s. */
export const CAMERA_TAU = 0.27;
