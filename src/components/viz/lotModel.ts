// Shared lot geometry for the lot views. Coordinates in feet, origin at the parcel centroid; x east, y north.
import { centroid, largestRing, pointInRing, polygonArea } from "@/lib/geometry";
import type { KeepHouse, Parcel, SplitPlan } from "@/lib/types";

export type LotModel = {
  ring: number[][];
  lotA: number[][] | null;
  lotB: number[][] | null;
  line: number[][] | null;
  buildings: number[][][];
  homes: { x: number; y: number; existing: boolean }[];
  extent: number;
  sepDir: [number, number]; // unit vector from lot A toward lot B
  areaA: number;
  areaB: number;
};

const rel = (c: number[]) => (p: number[]) => [p[0] - c[0], p[1] - c[1]];

export function buildLotModel(parcel: Parcel, split: SplitPlan | null, buildings: number[][][], homes: number | null, keep?: KeepHouse): LotModel {
  const outer = largestRing(parcel.rings);
  const c = centroid(outer);
  const f = rel(c);
  const ring = outer.map(f);
  const lotA = split ? split.lot_a.map(f) : null;
  const lotB = split ? split.lot_b.map(f) : null;
  const line = split ? split.line.map(f) : null;
  const bl = buildings.map((b) => b.map(f));
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  const extent = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));

  let sepDir: [number, number] = [0, 0];
  if (lotA && lotB) {
    const ca = centroid(lotA), cb = centroid(lotB);
    const d = Math.hypot(cb[0] - ca[0], cb[1] - ca[1]) || 1;
    sepDir = [(cb[0] - ca[0]) / d, (cb[1] - ca[1]) / d];
  }

  // Home markers: 2 per lot for a 4-home split. If the existing house fits on one lot, it is one of that lot's two.
  const out: LotModel["homes"] = [];
  const n = homes ?? 0;
  if (n >= 4 && lotA && lotB) {
    const keepLot = keep === "fits_a" ? lotA : keep === "fits_b" ? lotB : null;
    for (const lot of [lotA, lotB]) {
      const lc = centroid(lot);
      // Spread two homes along the lot's long direction (perpendicular to the split line direction).
      const along = sepDir;
      const lx = lot.map((p) => (p[0] - lc[0]) * along[0] + (p[1] - lc[1]) * along[1]);
      const half = (Math.max(...lx) - Math.min(...lx)) / 2;
      const perp: [number, number] = [-along[1], along[0]];
      const lp = lot.map((p) => (p[0] - lc[0]) * perp[0] + (p[1] - lc[1]) * perp[1]);
      const halfP = (Math.max(...lp) - Math.min(...lp)) / 2;
      // Use the longer axis of the lot.
      const axis = halfP > half ? perp : along;
      const span = Math.max(half, halfP) * 0.45;
      const spots = [[lc[0] - axis[0] * span, lc[1] - axis[1] * span], [lc[0] + axis[0] * span, lc[1] + axis[1] * span]];
      if (keepLot === lot && bl.length) {
        const bc = centroid(bl[0]);
        // Existing house takes the spot nearest to it; the other spot is the new home.
        const d0 = Math.hypot(spots[0][0] - bc[0], spots[0][1] - bc[1]), d1 = Math.hypot(spots[1][0] - bc[0], spots[1][1] - bc[1]);
        const other = d0 < d1 ? spots[1] : spots[0];
        out.push({ x: bc[0], y: bc[1], existing: true }, { x: other[0], y: other[1], existing: false });
      } else {
        spots.forEach((s) => out.push({ x: s[0], y: s[1], existing: false }));
      }
    }
  } else if (n === 2) {
    const cc = [0, 0];
    out.push({ x: cc[0] - extent * 0.15, y: cc[1], existing: false }, { x: cc[0] + extent * 0.15, y: cc[1], existing: false });
  }
  return {
    ring, lotA, lotB, line, buildings: bl, homes: out, extent, sepDir,
    areaA: lotA ? polygonArea([lotA]) : 0, areaB: lotB ? polygonArea([lotB]) : 0,
  };
}

export { pointInRing };
