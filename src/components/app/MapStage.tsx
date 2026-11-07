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

type Props = { site: SiteResult | null; listings: MapListing[]; onSelect: (id: string) => void; focus: string[] | null; cityView: boolean; inset?: number };

export default function MapStage({ site, listings, onSelect, focus, cityView, inset = 0 }: Props) {
  const [mode, setMode] = useState<ViewMode>("3d");
  const [replay, setReplay] = useState(0);
  const [city, setCity] = useState<{ points: number[][]; bbox: number[] } | null>(null);
  useEffect(() => {
    Promise.all([fetch("/city-points.json").then((r) => r.json()), fetch("/city-points.bin").then((r) => r.arrayBuffer())]).then(([m, b]) => {
      const a = new Int16Array(b);
      const points: number[][] = [];
      for (let i = 0; i < a.length; i += 3) points.push([a[i], a[i + 1], a[i + 2]]);
      setCity({ points, bbox: m.bbox });
    }).catch(() => {});
  }, []);
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

  let stage: React.ReactNode;
  if (mode === "map" && site && model) {
    stage = <LotParticles key={site.id} model={model} view="flat" height={"100%" as unknown as number} replayKey={replay} ink={INK} accent={ACCENT} inset={inset} />;
  } else if (mode === "map") {
    stage = city ? <ParticleCity points={city.points} bbox={city.bbox} mode="map" height={"100%" as unknown as number} ink={INK} accent={ACCENT} markers={markers} onMarker={onSelect} focus={groupFocus} inset={inset} /> : null;
  } else if (site && model) {
    stage = mode === "tech" ? <div style={{ position: "absolute", inset: 0, left: inset, top: 70, bottom: 40 }}><LotBlueprint model={model} height={"100%" as unknown as number} /></div> : <LotParticles key={site.id} model={model} view="3d" height={"100%" as unknown as number} replayKey={replay} ink={INK} accent={ACCENT} inset={inset} />;
  } else {
    stage = city ? <ParticleCity points={city.points} bbox={city.bbox} mode={mode === "tech" ? "tech" : "3d"} height={"100%" as unknown as number} ink={INK} accent={ACCENT} focus={groupFocus} inset={inset} /> : null;
  }

  const labelColor = "var(--muted)";
  return (
    <div className="stage-dark" style={{ position: "relative", height: "100%", background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>{stage}</div>
      <span className="eyebrow" style={{ position: "absolute", top: inset ? 82 : 64, left: inset + 16, right: 16, color: labelColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", zIndex: 2, pointerEvents: "none" }}>
        {site ? `${site.address}${site.parcel ? " · " + Math.round(site.parcel.area_sqft).toLocaleString() + " sq ft" : ""}` : "Santa Ana · every parcel"}
      </span>
      <span className="ff-viewswitch" style={{ position: "absolute", display: "flex", gap: 8, zIndex: 3 }} data-theme-scope="dark">
        {site && (mode === "3d" || mode === "map") && <button type="button" onClick={() => setReplay((r) => r + 1)} className="mapbtn" aria-label="Replay the lot split">Replay</button>}
        <span className="mapseg"><ViewSwitch mode={mode} onChange={setMode} modes={["3d", "map", "tech"]} /></span>
      </span>
      {mode === "map" && (
        <div style={{ position: "absolute", bottom: inset ? 64 : 12, right: inset ? 20 : 14, maxWidth: "calc(100% - 120px)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", zIndex: 2, pointerEvents: "none" }} className="eyebrow">
          <span style={{ color: "#ffaa5f" }}>●</span> <span style={{ color: "rgba(255,255,255,0.6)" }}>passes first SB 9 screen · click a № tag</span>
        </div>
      )}
      {!site && mode === "3d" && (
        <div style={{ position: "absolute", bottom: inset ? 26 : 14, left: inset ? inset + 16 : 14, zIndex: 2, pointerEvents: "none" }} className="eyebrow">
          <span style={{ color: "var(--accent)" }}>●</span> <span style={{ color: labelColor }}>passes first SB 9 screen</span>
        </div>
      )}
    </div>
  );
}
