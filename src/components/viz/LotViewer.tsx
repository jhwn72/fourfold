"use client";
import { useMemo, useState } from "react";
import type { KeepHouse, Parcel, SplitPlan } from "@/lib/types";
import LotBlueprint from "./LotBlueprint";
import LotParticles from "./LotParticles";
import { buildLotModel } from "./lotModel";
import ViewSwitch, { type ViewMode } from "./ViewSwitch";

type Props = { parcel: Parcel; split: SplitPlan | null; buildings?: number[][][]; homes: number | null; keep?: KeepHouse; height?: number };

export default function LotViewer({ parcel, split, buildings = [], homes, keep, height = 400 }: Props) {
  const [mode, setMode] = useState<ViewMode>("3d");
  const [replay, setReplay] = useState(0);
  const showSplit = Boolean(split && homes && homes >= 4);
  const model = useMemo(() => buildLotModel(parcel, showSplit ? split : null, buildings, homes, keep), [parcel, split, buildings, homes, keep, showSplit]);
  const kept = keep === "fits_a" || keep === "fits_b";
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-card)", background: "var(--viz-bg)", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        <span className="eyebrow">APN {parcel.apn} · {Math.round(parcel.area_sqft).toLocaleString()} sq ft</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {mode !== "tech" && <button type="button" onClick={() => setReplay((r) => r + 1)} style={{ padding: "3px 10px", fontSize: 12 }}>Replay</button>}
          <ViewSwitch mode={mode} onChange={setMode} />
        </span>
      </div>
      {mode === "tech" ? <LotBlueprint model={model} height={height} /> : <LotParticles model={model} view={mode === "flat" ? "flat" : "3d"} height={height} replayKey={replay} />}
      <div className="muted" style={{ padding: "8px 12px", borderTop: "1px solid var(--line)", fontSize: 12 }}>
        Real parcel outline from the city parcel layer.{showSplit ? " The split line is a sketch of one possible split, not a survey." : " SB 9 split not shown: the site does not pass."}
        {model.buildings.length ? ` Existing house footprint from OC Public Works${kept ? "; it fits on one lot, so it can stay." : "."}` : ""}
        {showSplit ? <> <span style={{ color: "var(--accent)" }}>Amber</span>: split line and new homes.</> : null}
      </div>
    </div>
  );
}
