import type { Parcel, SplitPlan } from "@/lib/types";
import { centroid, largestRing } from "@/lib/geometry";

// 2D drawing of the real parcel polygon (State Plane feet) with the sketched split line and house icons.
export default function LotSvg({ parcel, split, homes }: { parcel: Parcel; split: SplitPlan | null; homes: number | null }) {
  const ring = largestRing(parcel.rings);
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX, h = maxY - minY, pad = Math.max(w, h) * 0.08;
  const size = 320;
  const scale = (size - 2 * 16) / Math.max(w + 2 * pad, h + 2 * pad);
  const tx = (p: number[]) => [16 + (p[0] - minX + pad) * scale, 16 + (maxY - p[1] + pad) * scale]; // flip y: north up
  const pts = (r: number[][]) => r.map((p) => tx(p).map((v) => v.toFixed(1)).join(",")).join(" ");
  const vbW = 32 + (w + 2 * pad) * scale, vbH = 32 + (h + 2 * pad) * scale;

  const house = (x: number, y: number, k: string) => (
    <g key={k} transform={`translate(${x - 9},${y - 9})`}>
      <polygon points="9,0 18,8 0,8" fill="#0b5cad" />
      <rect x="3" y="8" width="12" height="10" fill="#0b5cad" />
    </g>
  );
  const icons: React.ReactNode[] = [];
  const perLot = homes && homes >= 4 ? 2 : homes === 2 ? 1 : 0;
  if (split && perLot) {
    [split.lot_a, split.lot_b].forEach((lot, i) => {
      const c = tx(centroid(lot));
      if (perLot === 2) { icons.push(house(c[0] - 12, c[1], `${i}a`), house(c[0] + 12, c[1], `${i}b`)); }
      else icons.push(house(c[0], c[1], `${i}a`));
    });
  }
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${vbW.toFixed(0)} ${vbH.toFixed(0)}`} width="100%" style={{ maxWidth: 360, background: "#fafafa", border: "1px solid #ddd" }} role="img" aria-label="Parcel outline with sketched split">
        {split && homes && homes >= 4 ? (
          <>
            <polygon points={pts(split.lot_a)} fill="#e3f5e5" stroke="#17642a" strokeWidth={1.5} />
            <polygon points={pts(split.lot_b)} fill="#e8f0fb" stroke="#0b5cad" strokeWidth={1.5} />
            <line x1={tx(split.line[0])[0]} y1={tx(split.line[0])[1]} x2={tx(split.line[1])[0]} y2={tx(split.line[1])[1]} stroke="#9b1c1c" strokeWidth={2} strokeDasharray="6 4" />
          </>
        ) : (
          <polygon points={pts(ring)} fill="#f1f1f1" stroke="#555" strokeWidth={1.5} />
        )}
        {icons}
      </svg>
      <figcaption className="muted">
        Real parcel outline (APN {parcel.apn}), north up, {Math.round(w)} × {Math.round(h)} ft bounding box.
        {split && homes && homes >= 4 ? ` Dashed line: a sketch of one equal split (${Math.round(split.lot_a_sqft).toLocaleString()} + ${Math.round(split.lot_b_sqft).toLocaleString()} sq ft), not a surveyed map.` : ""}
      </figcaption>
    </figure>
  );
}
