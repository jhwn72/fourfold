// Plane geometry in State Plane CA zone VI (wkid 2230), units are US survey feet.
type Pt = number[];

/** Signed shoelace area. Positive for counter-clockwise rings. */
export function signedArea(ring: Pt[]): number {
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    s += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return -s / 2;
}

/** Area of a polygon made of rings. ArcGIS outer rings are clockwise and holes counter-clockwise. */
export function polygonArea(rings: Pt[][]): number {
  return Math.abs(rings.reduce((sum, r) => sum + signedArea(r), 0));
}

export function largestRing(rings: Pt[][]): Pt[] {
  return rings.reduce((a, b) => (Math.abs(signedArea(b)) > Math.abs(signedArea(a)) ? b : a));
}

export function centroid(ring: Pt[]): Pt {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    a += f; cx += (ring[j][0] + ring[i][0]) * f; cy += (ring[j][1] + ring[i][1]) * f;
  }
  if (Math.abs(a) < 1e-9) {
    return [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

/**
 * Pull every vertex 1 ft toward the centroid. Used for overlay queries so a parcel that only
 * shares a boundary line with a neighboring zone or hazard polygon is not counted as inside it.
 */
export function shrinkRing(ring: Pt[], feet = 1): Pt[] {
  const [cx, cy] = centroid(ring);
  return ring.map(([x, y]) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d <= feet) return [x, y];
    return [x - (dx / d) * feet, y - (dy / d) * feet];
  });
}

function rotate(p: Pt, a: number): Pt {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}

/** Clip a polygon to the half-plane x <= c (keepLeft) or x >= c. Sutherland-Hodgman. */
function clipX(ring: Pt[], c: number, keepLeft: boolean): Pt[] {
  const inside = (p: Pt) => (keepLeft ? p[0] <= c : p[0] >= c);
  const out: Pt[] = [];
  const pts = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i], prev = pts[(i + pts.length - 1) % pts.length];
    const ci = inside(cur), pi = inside(prev);
    if (ci !== pi) {
      const t = (c - prev[0]) / (cur[0] - prev[0]);
      out.push([c, prev[1] + t * (cur[1] - prev[1])]);
    }
    if (ci) out.push(cur);
  }
  return out;
}

/**
 * Split the lot into two equal-area parts with a straight cut across its long side.
 * This is a sketch of one possible split, not a surveyed parcel map.
 */
export function equalSplit(ring: Pt[], flip = false) {
  // Orient by the longest edge, so the cut runs across the lot's depth.
  let best = 0, angle = 0;
  for (let i = 1; i < ring.length; i++) {
    const dx = ring[i][0] - ring[i - 1][0], dy = ring[i][1] - ring[i - 1][1];
    const len = Math.hypot(dx, dy);
    if (len > best) { best = len; angle = Math.atan2(dy, dx); }
  }
  let r = ring.map((p) => rotate(p, -angle));
  let xs = r.map((p) => p[0]), ys = r.map((p) => p[1]);
  // If the lot is taller than wide in this frame, turn it 90 degrees so we always cut along x.
  let extra = 0;
  if ((Math.max(...ys) - Math.min(...ys) > Math.max(...xs) - Math.min(...xs)) !== flip) {
    extra = Math.PI / 2;
    r = r.map((p) => rotate(p, -extra));
    xs = r.map((p) => p[0]); ys = r.map((p) => p[1]);
  }
  const total = Math.abs(signedArea(r));
  let lo = Math.min(...xs), hi = Math.max(...xs);
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    const left = Math.abs(signedArea(clipX(r, mid, true)));
    if (left < total / 2) lo = mid; else hi = mid;
  }
  const c = (lo + hi) / 2;
  const a = clipX(r, c, true), b = clipX(r, c, false);
  const back = (p: Pt) => rotate(rotate(p, extra), angle);
  const yLo = Math.min(...ys), yHi = Math.max(...ys);
  return {
    lot_a: a.map(back),
    lot_b: b.map(back),
    lot_a_sqft: Math.abs(signedArea(a)),
    lot_b_sqft: Math.abs(signedArea(b)),
    line: [back([c, yLo]), back([c, yHi])] as [number, number][],
  };
}

/** Even-odd point in polygon. */
export function pointInRing(p: Pt, ring: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Find a straight split line that keeps every existing building wholly on one lot, with both lots at least
 * minLot sq ft and the smaller at least minShare of the total. Tries both cut directions. Returns null if none.
 * A sketch for screening, not a surveyed parcel map.
 */
export function splitClearing(ring: Pt[], buildings: Pt[][], minLot: number, minShare: number) {
  let best: ReturnType<typeof equalSplit> | null = null;
  let bestGap = Infinity;
  const total = Math.abs(signedArea(ring));
  for (const flip of [false, true]) {
    const eq = equalSplit(ring, flip);
    // Rebuild the rotated frame used by equalSplit from its cut line direction.
    const [p0, p1] = eq.line;
    const lineAngle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); // cut runs along local y
    const a = lineAngle - Math.PI / 2; // local x axis
    const r = ring.map((p) => rotate(p, -a));
    const bx = buildings.flatMap((b) => b.map((p) => rotate(p, -a)[0]));
    const bx0 = Math.min(...bx), bx1 = Math.max(...bx);
    for (const c of [bx1 + 2, bx0 - 2]) {
      const left = clipX(r, c, true), right = clipX(r, c, false);
      if (left.length < 3 || right.length < 3) continue;
      const la = Math.abs(signedArea(left)), ra = Math.abs(signedArea(right));
      if (la < minLot || ra < minLot || Math.min(la, ra) / total < minShare) continue;
      const gap = Math.abs(la - ra);
      if (gap < bestGap) {
        bestGap = gap;
        const ys = r.map((p) => p[1]);
        const back = (p: Pt) => rotate(p, a);
        best = {
          lot_a: left.map(back), lot_b: right.map(back), lot_a_sqft: la, lot_b_sqft: ra,
          line: [back([c, Math.min(...ys)]), back([c, Math.max(...ys)])] as [number, number][],
        };
      }
    }
  }
  return best;
}
