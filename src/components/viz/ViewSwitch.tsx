"use client";
// Segmented control for the three views (Tango-style .seg).
export type ViewMode = "map" | "3d" | "flat" | "tech";
const LABELS: Record<ViewMode, string> = { map: "Map", "3d": "3D", flat: "Flat", tech: "Technical" };

export default function ViewSwitch({ mode, onChange, modes = ["3d", "flat", "tech"] }: { mode: ViewMode; onChange: (m: ViewMode) => void; modes?: ViewMode[] }) {
  return (
    <div className="seg" role="tablist" aria-label="View">
      {modes.map((m) => (
        <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => onChange(m)}>
          {LABELS[m]}
        </button>
      ))}
    </div>
  );
}
