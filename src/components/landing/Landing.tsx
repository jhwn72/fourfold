"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { setTheme, useTheme } from "../theme";
import { useReducedMotion } from "../viz/useReducedMotion";
import Tunnel from "./Tunnel";
import type { TileListing } from "./tiles";
import s from "./landing.module.css";

// Only applicants SB 9 exempts from the 3-year owner-occupancy affidavit: "a community land trust or
// nonprofit organization" (HCD SB 9 fact sheet, April 2026, p.2). Every word here is one of those.
const WORDS = ["nonprofits", "community land trusts", "faith-based nonprofits", "nonprofit homebuilders"];

type Stats = { listings: number; parcels: number; date: string };

export default function Landing({ listings, bbox, stats }: { listings: TileListing[]; bbox: number[]; stats: Stats }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const router = useRouter();
  // Entering the app: the UI fades, the tunnel speeds up and the city at its end rushes toward the
  // viewer, the screen settles to the app's black stage, then the route changes under the black.
  const [leaving, setLeaving] = useState(false);
  const warp = useRef(0); // 0 to 1, read by the tunnel every frame
  useEffect(() => { router.prefetch("/app"); }, [router]);
  const enter = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let new-tab clicks through
    e.preventDefault();
    if (leaving) return;
    setLeaving(true);
    try { sessionStorage.setItem("ff-entered", String(Date.now())); } catch {}
    if (reduced) { router.push("/app"); return; }
    const t0 = performance.now();
    const step = (now: number) => {
      warp.current = Math.min(1, (now - t0) / 1100);
      if (warp.current < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    window.setTimeout(() => router.push("/app"), 1150);
  };
  const [i, setI] = useState(0);
  const [chipW, setChipW] = useState<number | null>(null);
  const measure = useRef<HTMLSpanElement>(null);

  // This page owns the viewport: no page scroll while it is open.
  useEffect(() => {
    const h = document.documentElement, prev = h.style.overflow;
    h.style.overflow = "hidden";
    return () => { h.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);

  // The pill fits the word it is showing: measure that word (same font as the pill) every time it
  // changes, on resize, and once fonts finish loading.
  useLayoutEffect(() => {
    const read = () => {
      const el = measure.current?.children[i] as HTMLElement | undefined;
      if (el) setChipW(Math.ceil(el.getBoundingClientRect().width));
    };
    read();
    document.fonts?.ready.then(read).catch(() => {});
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, [i]);

  return (
    <div className={`${s.root} ${leaving ? s.leaving : ""}`}>
      <div className={s.veil} aria-hidden="true" />
      <div className={s.stage}>
        <Tunnel listings={listings} bbox={bbox} theme={theme} warp={warp} />
        <div className={s.vignette} />
      </div>

      <nav className={s.nav} aria-label="Main">
        <Link href="/" className={s.glyph} aria-label="FourFold home"><span /><span /><span /><span /></Link>
        <Link href="/method" className={s.link}>How it works</Link>
        <Link href="/app" onClick={enter} className={s.solid}>Open FourFold</Link>
      </nav>

      <section className={s.hero}>
        <h1 className={s.word}>FOURFOLD<sup>©</sup></h1>
        <p className={s.sub}>
          <span>One house, four homes for</span>
          <span className={s.chip} style={chipW ? { width: chipW + 26 } : undefined} aria-live="polite">
            <span key={i} className={reduced ? s.chipTextStatic : s.chipText}>{WORDS[i]}</span>
          </span>
        </p>
        <Link href="/app" onClick={enter} className={s.cta}>Enter FourFold <span aria-hidden="true">→</span></Link>
        <span ref={measure} className={s.measure} aria-hidden="true">
          {WORDS.map((w) => <span key={w}>{w}</span>)}
        </span>
      </section>

      <div className={s.toggle} role="group" aria-label="Theme">
        <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</button>
        <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Light</button>
      </div>

      <div className={s.meta}>
        <span>Santa Ana · {stats.listings} listings · {stats.parcels.toLocaleString("en-US")} parcels screened · {stats.date}</span>
        <span className={s.disclaimer}>Prototype. Not legal or financial advice. Confirm with the city and a professional.</span>
      </div>

      <Link href="/app" onClick={enter} className={s.enter}>
        <span>Enter the app</span>
        <span className={s.square} aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
