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
import ParticleCity from "../viz/ParticleCity";
import ViewSwitch, { type ViewMode } from "../viz/ViewSwitch";

// The stage stays black in every view and theme (reference: black dot-matrix map), so particles get light ink.
const INK = "#f4f4f4";
const ACCENT = "#ffaa5f";

type Props = { site: SiteResult | null; listings: MapListing[]; onSelect: (id: string) => void; focus: string[] | null; cityView: boolean };

export default function MapStage({ site, listings, onSelect, focus, cityView }: Props) {
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

  let stage: React.ReactNode;
  if (mode === "map") {
    stage = <DotMap listings={listings} selected={site?.id ?? null} onSelect={onSelect} focus={site ? null : focus} cityView={!site && cityView} />;
  } else if (site && model) {
    stage = mode === "tech" ? <LotBlueprint model={model} height={"100%" as unknown as number} /> : <LotParticles key={site.id} model={model} view="3d" height={"100%" as unknown as number} replayKey={replay} ink={INK} accent={ACCENT} />;
  } else {
    stage = city ? <ParticleCity points={city.points} bbox={city.bbox} mode={mode === "tech" ? "tech" : "3d"} height={"100%" as unknown as number} ink={INK} accent={ACCENT} /> : null;
  }

  const labelColor = "var(--muted)";
  return (
    <div className="stage-dark" style={{ position: "relative", height: "100%", background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>{stage}</div>
      <div style={{ position: "absolute", top: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", zIndex: 2, pointerEvents: "none" }}>
        <span className="eyebrow" style={{ color: labelColor, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "1 1 160px" }}>
          {site ? `${site.address}${site.parcel ? " · " + Math.round(site.parcel.area_sqft).toLocaleString() + " sq ft" : ""}` : "Santa Ana · every parcel"}
        </span>
        <span style={{ display: "flex", gap: 8, pointerEvents: "auto" }} data-theme-scope="dark">
          {site && mode === "3d" && <button type="button" onClick={() => setReplay((r) => r + 1)} className="mapbtn" aria-label="Replay the lot split">Replay</button>}
          <span className="mapseg"><ViewSwitch mode={mode} onChange={setMode} modes={["3d", "map", "tech"]} /></span>
        </span>
      </div>
      {!site && mode === "3d" && (
        <div style={{ position: "absolute", bottom: 14, left: 14, zIndex: 2, pointerEvents: "none" }} className="eyebrow">
          <span style={{ color: "var(--accent)" }}>●</span> <span style={{ color: labelColor }}>passes first SB 9 screen</span>
        </div>
      )}
    </div>
  );
}
