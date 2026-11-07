"use client";
// Dot-matrix map (reference: dashboard with a halftone city map). Every bright dot comes from real parcels:
// dot size follows how many Santa Ana parcels fall in that cell. Listings get "№" tags; the selected lot
// is drawn at real shape with its sketched split and homes. The map stays black in both themes.
import { useEffect, useRef } from "react";
import { centroid, largestRing } from "@/lib/geometry";
import { useReducedMotion } from "./useReducedMotion";

export type MapListing = {
  id: string;
  n: number; // rank
  verdict: string;
  ring: number[][] | null; // State Plane feet
  split: { lot_a: number[][]; lot_b: number[][]; line: number[][] } | null;
  buildings: number[][][];
  homes: number | null;
};

type City = { pts: Int16Array; bbox: number[] };

const CELL = 7; // px between dot centres

export default function DotMap({
  listings, selected, onSelect, height = "100%", focusOnly = false, focus = null, cityView = false,
}: { listings: MapListing[]; selected: string | null; onSelect?: (id: string) => void; height?: number | string; focusOnly?: boolean; focus?: string[] | null; cityView?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const selRef = useRef(selected);
  selRef.current = selected;
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const cityRef = useRef(cityView);
  cityRef.current = cityView;
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const hits = useRef<{ id: string; x: number; y: number; w: number; h: number }[]>([]);

  useEffect(() => {
    let city: City | null = null;
    let live = true;
    fetch("/city-points.bin").then((r) => r.arrayBuffer()).then((b) =>
      fetch("/city-points.json").then((r) => r.json()).then((m) => { if (live) city = { pts: new Int16Array(b), bbox: m.bbox }; })
    ).catch(() => {});

    const cv = canvas.current!, el = wrap.current!;
    const ctx = cv.getContext("2d")!;
    let W = 1, H = 1, pr = 1;
    const resize = () => {
      pr = Math.min(window.devicePixelRatio || 1, 2);
      W = el.clientWidth; H = el.clientHeight;
      cv.width = W * pr; cv.height = H * pr; cv.style.width = W + "px"; cv.style.height = H + "px";
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const withRing = listings.filter((l) => l.ring);
    const cents = withRing.map((l) => centroid(largestRing([l.ring!])));
    // Overview frame: all listings, padded.
    const xs = cents.map((c) => c[0]), ys = cents.map((c) => c[1]);
    const ov = { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, span: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.5 + 2000 };
    const cam = { cx: ov.cx, cy: ov.cy, span: ov.span };
    const target = () => {
      const s = selRef.current ? withRing.find((l) => l.id === selRef.current) : null;
      if (s) { const c = centroid(largestRing([s.ring!])); const r = largestRing([s.ring!]); const e = Math.max(...r.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1]))); return { cx: c[0], cy: c[1], span: e * 5.2 }; }
      const f = focusRef.current;
      if (f && f.length) {
        const fc = withRing.map((l, i) => (f.includes(l.id) ? cents[i] : null)).filter((c): c is number[] => !!c);
        if (fc.length) {
          const fx = fc.map((c) => c[0]), fy = fc.map((c) => c[1]);
          return { cx: (Math.min(...fx) + Math.max(...fx)) / 2, cy: (Math.min(...fy) + Math.max(...fy)) / 2, span: Math.max(Math.max(...fx) - Math.min(...fx), Math.max(...fy) - Math.min(...fy)) * 1.8 + 900 };
        }
      }
      if (cityRef.current && city) {
        const b = city.bbox;
        return { cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2, span: Math.max(b[2] - b[0], b[3] - b[1]) * 1.02 };
      }
      return focusOnly && withRing[0] ? { cx: cents[0][0], cy: cents[0][1], span: 600 } : ov;
    };
    if (selRef.current || focusOnly) Object.assign(cam, target());

    const seed = new Float32Array(4096).map(() => Math.random());
    let counts = new Float32Array(1);
    const t0 = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const tg = target();
      const k = reducedRef.current ? 1 : 0.08;
      cam.cx += (tg.cx - cam.cx) * k; cam.cy += (tg.cy - cam.cy) * k; cam.span += (tg.span - cam.span) * k;
      const scale = Math.min(W, H) / cam.span; // px per foot
      const sx = (x: number) => W / 2 + (x - cam.cx) * scale;
      const sy = (y: number) => H / 2 - (y - cam.cy) * scale;
      ctx.setTransform(pr, 0, 0, pr, 0, 0);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);

      // Halftone: bin parcels into screen cells.
      const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
      if (counts.length !== cols * rows) counts = new Float32Array(cols * rows); else counts.fill(0);
      if (city) {
        const [bx, by] = city.bbox, p = city.pts;
        for (let i = 0; i < p.length; i += 3) {
          const X = sx(bx + p[i] * 10), Y = sy(by + p[i + 1] * 10);
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          counts[((Y / CELL) | 0) * cols + ((X / CELL) | 0)] += p[i + 2] === 1 ? 1.25 : 1;
        }
      }
      const intro = reducedRef.current ? 1 : Math.min(1, t / 1.6);
      const perCellFull = Math.max(0.6, 2.2 * (CELL / scale / 60) ** 2); // parcels per cell for a full dot at this zoom
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const sd = seed[i & 4095];
          if (sd > intro * 1.05) continue;
          const v = counts[i];
          const x = c * CELL + CELL / 2, y = r * CELL + CELL / 2;
          if (v <= 0) { // base grid, faint
            ctx.fillStyle = "rgba(255,255,255,0.07)";
            ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
            continue;
          }
          const f = Math.min(1, Math.sqrt(v / perCellFull));
          const tw = reducedRef.current ? 1 : 0.82 + 0.18 * Math.sin(t * 1.3 + sd * 40);
          ctx.fillStyle = `rgba(255,255,255,${(0.25 + 0.6 * f) * tw})`;
          const rad = 0.6 + f * (CELL * 0.32);
          ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }
      }

      // Listings
      hits.current = [];
      ctx.font = `11px ${getComputedStyle(document.documentElement).getPropertyValue("--font-mono") || "monospace"}`;
      const poly = (r: number[][]) => { ctx.beginPath(); r.forEach((p, j) => (j ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])))); ctx.closePath(); };
      withRing.forEach((l, idx) => {
        const ring = largestRing([l.ring!]);
        const c = cents[idx];
        const X = sx(c[0]), Y = sy(c[1]);
        const isSel = l.id === selRef.current;
        const ext = Math.max(...ring.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1]))) * scale;
        const dim = l.verdict === "NO";
        if (ext > 10) {
          poly(ring);
          ctx.fillStyle = "#000"; ctx.fill();
          if (isSel) {
            // Dense dot texture inside the selected lot, with a soft glow.
            ctx.save(); poly(ring); ctx.clip();
            const g = 3;
            const x0 = Math.min(...ring.map((p) => sx(p[0]))), x1 = Math.max(...ring.map((p) => sx(p[0])));
            const y0 = Math.min(...ring.map((p) => sy(p[1]))), y1 = Math.max(...ring.map((p) => sy(p[1])));
            for (let yy = y0; yy < y1; yy += g) for (let xx = x0; xx < x1; xx += g) {
              const sd = seed[(((xx * 7) | 0) + ((yy * 13) | 0)) & 4095];
              ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.45 * sd})`;
              ctx.fillRect(xx, yy, 1.2, 1.2);
            }
            ctx.restore();
            ctx.shadowColor = "rgba(255,255,255,0.6)"; ctx.shadowBlur = 18;
          }
          poly(ring);
          ctx.strokeStyle = dim ? "rgba(255,255,255,0.45)" : "#fff"; ctx.lineWidth = isSel ? 2 : 1.6; ctx.stroke();
          ctx.shadowBlur = 0;
          if (isSel && l.split && (l.homes ?? 0) >= 4) {
            ctx.setLineDash([6, 4]); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(sx(l.split.line[0][0]), sy(l.split.line[0][1])); ctx.lineTo(sx(l.split.line[1][0]), sy(l.split.line[1][1])); ctx.stroke();
            ctx.setLineDash([]);
          }
          if (isSel) l.buildings.forEach((b) => { poly(b); ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]); });
        } else {
          ctx.fillStyle = "#000"; ctx.strokeStyle = dim ? "rgba(255,255,255,0.45)" : "#fff"; ctx.lineWidth = 1.5;
          ctx.fillRect(X - 6, Y - 6, 12, 12); ctx.strokeRect(X - 6, Y - 6, 12, 12);
        }
        // "№" tag
        const label = `№${l.n}`;
        const tw = ctx.measureText(label).width + 12;
        const tx = X + Math.max(ext, 8) * 0.7 + 4, ty = Y - Math.max(ext, 8) * 0.7 - 20;
        ctx.fillStyle = "#000"; ctx.fillRect(tx, ty, tw, 18);
        ctx.strokeStyle = isSel ? "#fff" : dim ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.7)"; ctx.lineWidth = 1; ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, 17);
        ctx.fillStyle = dim ? "rgba(255,255,255,0.55)" : "#fff"; ctx.fillText(label, tx + 6, ty + 13);
        hits.current.push({ id: l.id, x: Math.min(tx, X - 8), y: Math.min(ty, Y - 8), w: Math.max(tw + (tx - X) + 8, 16), h: Math.max(Y - ty + 8, 16) });
      });

      // Scale bar
      const ft = cam.span > 8000 ? 5280 : cam.span > 1500 ? 1000 : 100;
      const len = ft * scale;
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(14, H - 16); ctx.lineTo(14 + len, H - 16); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillText(ft === 5280 ? "1 MI" : `${ft} FT`, 14, H - 22);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onClick = (e: MouseEvent) => {
      if (!onSelect) return;
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const h = hits.current.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
      if (h) onSelect(h.id);
    };
    cv.addEventListener("click", onClick);
    return () => { live = false; cancelAnimationFrame(raf); ro.disconnect(); cv.removeEventListener("click", onClick); };
  }, [listings, onSelect, focusOnly]);

  return (
    <div ref={wrap} style={{ position: "relative", width: "100%", height, background: "#000", overflow: "hidden" }}>
      <canvas ref={canvas} style={{ display: "block", cursor: onSelect ? "pointer" : "default" }} role="img" aria-label="Dot map of Santa Ana parcels with listing tags" />
    </div>
  );
}
