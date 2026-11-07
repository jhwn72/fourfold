"use client";
// Canvas dot map of every Santa Ana parcel centroid from data/citywide.json.
// Points are [x, y, code] in 10 ft units from the bbox min (State Plane, so north is up). Codes: 0 no, 1 candidate, 2 in district.
import { useEffect, useRef } from "react";

const COLORS = ["#c4c4c4", "#1f9d3a", "#e0a100"];

export default function CityMap({ points, width, height }: { points: number[][]; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const cssW = canvas.clientWidth;
      const cssH = (cssW * height) / width;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + "px";
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      const k = cssW / width;
      const r = Math.max(0.6, Math.min(1.6, cssW / 700));
      // Gray first, then amber, then green on top so candidates stay visible.
      for (const code of [0, 2, 1]) {
        ctx.fillStyle = COLORS[code];
        for (const p of points) {
          if (p[2] !== code) continue;
          ctx.fillRect(p[0] * k - r / 2, cssH - p[1] * k - r / 2, r, r);
        }
      }
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [points, width, height]);

  return (
    <div>
      <canvas ref={ref} style={{ width: "100%", maxWidth: 820, display: "block", border: "1px solid #ddd", borderRadius: 6 }} aria-label="Map of Santa Ana parcels colored by SB 9 screen result" role="img" />
      <p className="muted" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <span><Swatch c={COLORS[1]} /> Candidate</span>
        <span><Swatch c={COLORS[2]} /> Would be candidate, but inside a historic district</span>
        <span><Swatch c={COLORS[0]} /> No (zone, size, shared lot, flood or historic list)</span>
        <span>North is up. One dot per parcel centroid.</span>
      </p>
    </div>
  );
}

function Swatch({ c }: { c: string }) {
  return <span style={{ display: "inline-block", width: 10, height: 10, background: c, borderRadius: 2, marginRight: 4 }} />;
}
