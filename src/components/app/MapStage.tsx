"use client";
// The right side of the app. Default is 3D particles; Dot map and Technical are the other views.
// Overview: the particle city. A selected site: the lot in particles, splitting, with homes rising.
import { useEffect, useMemo, useState } from "react";
import type { SiteResult } from "@/lib/types";
import CityHero from "../viz/CityHero";
import DotMap, { type MapListing } from "../viz/DotMap";
import LotBlueprint from "../viz/LotBlueprint";
import LotParticles from "../viz/LotParticles";
import { buildLotModel } from "../viz/lotModel";
import ParticleCity, { type CityMarker } from "../viz/ParticleCity";
import { centroid, largestRing } from "@/lib/geometry";
import ViewSwitch, { type ViewMode } from "../viz/ViewSwitch";

// The stage stays black in every view and theme (reference: black dot-matrix map), so particles get light ink.
const INK = "#f4f4f4";
const ACCENT = "#ffaa5f";

type Props = { stageCity?: string; pointFocus?: { cx: number; cy: number; span: number } | null; site: SiteResult | null; listings: MapListing[]; onSelect: (id: string) => void; focus: string[] | null; cityView: boolean; inset?: number; lotStart?: number | null; onReplay?: () => void };

// City to lot handoff: the camera flies for FLY ms, then the lot layer crossfades in over STAGE ms.
const FLY = 450, STAGE = 600;

export default function MapStage({ stageCity = "Santa Ana", pointFocus = null, site: selected, listings, onSelect, focus, cityView, inset = 0, lotStart = null, onReplay }: Props) {
  const [mode, setMode] = useState<ViewMode>("3d");
  // Keep the last site drawn while the lot layer fades out on Back, so nothing blinks.
  const [held, setHeld] = useState<SiteResult | null>(selected);
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    if (selected) { setHeld(selected); const t = setTimeout(() => setCovered(true), FLY + STAGE + 50); return () => clearTimeout(t); }
    setCovered(false);
    const t = setTimeout(() => setHeld(null), STAGE);
    return () => clearTimeout(t);
  }, [selected]);
  const site = selected ?? held;
  // Particle city per name: Santa Ana is /city-points.*, the others /city-points-<slug>.*. Cached after first load.
  const [cache, setCache] = useState<Record<string, { points: number[][]; bbox: number[] }>>({});
  const city = cache[stageCity] ?? null;
  useEffect(() => {
    if (cache[stageCity]) return;
    const base = stageCity === "Santa Ana" ? "/city-points" : `/city-points-${stageCity.toLowerCase().replace(/\s+/g, "-")}`;
    let live = true;
    Promise.all([fetch(`${base}.json`).then((r) => r.json()), fetch(`${base}.bin`).then((r) => r.arrayBuffer())]).then(([m, b]) => {
      const a = new Int16Array(b);
      const points: number[][] = [];
      for (let i = 0; i < a.length; i += 3) points.push([a[i], a[i + 1], a[i + 2]]);
      if (live) setCache((c) => ({ ...c, [stageCity]: { points, bbox: m.bbox } }));
    }).catch(() => {});
    return () => { live = false; };
  }, [stageCity, cache]);
  const showSplit = Boolean(site?.split && site.max_homes && site.max_homes >= 4);
  const model = useMemo(() => (site?.parcel ? buildLotModel(site.parcel, showSplit ? site.split : null, site.buildings ?? [], site.max_homes, site.keep_house) : null), [site, showSplit]);
  void CityHero;

  // № tags and group framing for the top-down particle Map view (feet, State Plane).
  const markers: CityMarker[] = useMemo(() => listings.filter((l) => l.ring).map((l) => {
    const c = centroid(largestRing([l.ring!]));
    return { id: l.id, label: `№${l.n}`, x: c[0], y: c[1], dim: l.verdict === "NO" };
  }), [listings]);
  const groupFocus = useMemo(() => {
    if (!focus || !focus.length) return null;
    const ms = markers.filter((m) => focus.includes(m.id));
    if (!ms.length) return null;
    const xs = ms.map((m) => m.x), ys = ms.map((m) => m.y);
    return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, span: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 2 + 2500 };
  }, [focus, markers]);
  void DotMap; void cityView;
  // Selected site: the city camera flies to its parcel before the lot fades in.
  const siteFocus = useMemo(() => {
    if (!selected) return null;
    const m = markers.find((x) => x.id === selected.id);
    return m ? { cx: m.x, cy: m.y, span: 900 } : null;
  }, [selected, markers]);

  // The city stays mounted under the lot (one continuous world: no remount, no replayed intro).
  const full = "100%" as unknown as number;
  const lotOn = Boolean(selected && model);
  const isSA = stageCity === "Santa Ana";
  const cityLayer = city ? (
    <ParticleCity key={stageCity} points={city.points} bbox={city.bbox} mode={mode === "map" ? "map" : mode === "tech" ? "tech" : "3d"} height={full} ink={INK} accent={ACCENT}
      markers={mode === "map" && !selected && isSA ? markers : undefined} onMarker={onSelect} focus={selected ? siteFocus : pointFocus ?? (isSA ? groupFocus : null)} inset={inset} paused={covered && lotOn} />
  ) : null;
  const lotLayer = site && model ? (
    mode === "tech"
      ? <div style={{ position: "absolute", inset: 0, left: inset, top: 70, bottom: 40 }}><LotBlueprint model={model} height={full} /></div>
      : <LotParticles key={site.id} model={model} view={mode === "map" ? "flat" : "3d"} height={full} startAt={lotStart ?? undefined} ink={INK} accent={ACCENT} inset={inset} paused={!selected && !held} />
  ) : null;
  const stage = (
    <>
      <div className="ff-layer" style={{ position: "absolute", inset: 0, opacity: lotOn ? 0 : 1, transitionDelay: lotOn ? `${FLY}ms` : "0ms" }}>{cityLayer}</div>
      <div className="ff-layer" style={{ position: "absolute", inset: 0, background: "#000", opacity: lotOn ? 1 : 0, transitionDelay: lotOn ? `${FLY}ms` : "0ms", pointerEvents: lotOn ? "auto" : "none" }}>{lotLayer}</div>
    </>
  );

  const labelColor = "var(--muted)";
  return (
    <div className="stage-dark" style={{ position: "relative", height: "100%", background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>{stage}</div>
      <span className="eyebrow" style={{ position: "absolute", top: inset ? 96 : 72, left: inset + 24, right: 24, color: labelColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", zIndex: 2, pointerEvents: "none" }}>
        {site ? `${site.address}${site.parcel ? " · " + Math.round(site.parcel.area_sqft).toLocaleString() + " sq ft" : ""}` : `${stageCity} · every parcel`}
      </span>
      <span className="ff-viewswitch" style={{ position: "absolute", display: "flex", gap: 8, zIndex: 3 }} data-theme-scope="dark">
        {site && (mode === "3d" || mode === "map") && <button type="button" onClick={() => onReplay?.()} className="mapbtn" aria-label="Replay the lot split">Replay</button>}
        <span className="mapseg"><ViewSwitch mode={mode} onChange={setMode} modes={["3d", "map", "tech"]} /></span>
      </span>
    </div>
  );
}
