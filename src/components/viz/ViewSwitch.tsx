"use client";
// Segmented control for the three views (Tango-style .seg).
export type ViewMode = "3d" | "flat" | "tech";
const LABELS: Record<ViewMode, string> = { "3d": "3D", flat: "Flat", tech: "Technical" };

export default function ViewSwitch({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="seg" role="tablist" aria-label="View">
      {(Object.keys(LABELS) as ViewMode[]).map((m) => (
        <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => onChange(m)}>
          {LABELS[m]}
        </button>
      ))}
    </div>
  );
}
