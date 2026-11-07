"use client";
import { useEffect, useState } from "react";
import ParticleCity from "./ParticleCity";
import ViewSwitch, { type ViewMode } from "./ViewSwitch";

type Meta = { bbox: number[]; counts: Record<string, number> };

/** Loads the packed parcel points (public/city-points.bin, built by scripts/city-points.ts) and draws them. */
export default function CityHero({ height = 520 }: { height?: number }) {
  const [mode, setMode] = useState<ViewMode>("3d");
  const [data, setData] = useState<{ points: number[][]; bbox: number[] } | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([fetch("/city-points.json").then((r) => r.json() as Promise<Meta>), fetch("/city-points.bin").then((r) => r.arrayBuffer())]).then(([meta, buf]) => {
      const a = new Int16Array(buf);
      const points: number[][] = [];
      for (let i = 0; i < a.length; i += 3) points.push([a[i], a[i + 1], a[i + 2]]);
      if (live) setData({ points, bbox: meta.bbox });
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  return (
    <div style={{ position: "relative", border: "1px solid var(--line)", borderRadius: "var(--radius-card)", overflow: "hidden", background: "var(--viz-bg)" }}>
      <div style={{ position: "absolute", top: 12, left: 14, right: 14, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", pointerEvents: "none" }}>
        <span className="eyebrow">Santa Ana · every parcel · one dot each</span>
        <span style={{ pointerEvents: "auto" }}><ViewSwitch mode={mode} onChange={setMode} /></span>
      </div>
      {data ? <ParticleCity points={data.points} bbox={data.bbox} mode={mode} height={height} /> : <div style={{ height }} />}
      <div style={{ position: "absolute", bottom: 12, right: 14, zIndex: 2, display: "flex", gap: 14, pointerEvents: "none" }} className="eyebrow">
        <span><span style={{ color: "var(--accent)" }}>●</span> passes first SB 9 screen</span>
        <span><span style={{ color: "var(--muted)" }}>●</span> other parcel</span>
      </div>
    </div>
  );
}
