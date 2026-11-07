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
export function equalSplit(ring: Pt[]) {
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
  if (Math.max(...ys) - Math.min(...ys) > Math.max(...xs) - Math.min(...xs)) {
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
