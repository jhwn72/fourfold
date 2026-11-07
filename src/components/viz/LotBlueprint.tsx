// Technical view: a clean blueprint a developer would read. Edge lengths in feet, the sketched split with lot
// areas, the 4 ft side/rear setback SB 9 allows at most (HCD SB 9 Fact Sheet, Sept 2024, p.4), existing footprint.
import { centroid, signedArea } from "@/lib/geometry";
import type { LotModel } from "./lotModel";

function open(r: number[][]) {
  const a = r[0], b = r[r.length - 1];
  return a[0] === b[0] && a[1] === b[1] ? r.slice(0, -1) : r;
}

/** Inset a polygon by d feet (simple miter offset; fine for the near-rectangular lots here). */
function inset(ring: number[][], d: number): number[][] {
  const r = open(ring);
  const ccw = signedArea([...r, r[0]]) > 0;
  const lines = r.map((p, i) => {
    const q = r[(i + 1) % r.length];
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1;
    const nx = (ccw ? -dy : dy) / L, ny = (ccw ? dx : -dx) / L; // inward normal
    return { p: [p[0] + nx * d, p[1] + ny * d], v: [dx, dy] };
  });
  const out: number[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const a = lines[(i + lines.length - 1) % lines.length], b = lines[i];
    const den = a.v[0] * b.v[1] - a.v[1] * b.v[0];
    if (Math.abs(den) < 1e-9) { out.push(b.p); continue; }
    const t = ((b.p[0] - a.p[0]) * b.v[1] - (b.p[1] - a.p[1]) * b.v[0]) / den;
    out.push([a.p[0] + a.v[0] * t, a.p[1] + a.v[1] * t]);
  }
  return out;
}

export default function LotBlueprint({ model, height = 420 }: { model: LotModel; height?: number }) {
  const ring = open(model.ring);
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  const pad = model.extent * 0.16;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  const W = maxX - minX, H = maxY - minY;
  const X = (x: number) => x - minX, Y = (y: number) => maxY - y; // north up
  const pts = (r: number[][]) => open(r).map((p) => `${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`).join(" ");
  const fs = model.extent / 42; // font size in feet units
  const sw = model.extent / 420;
  const ink = "var(--text)", faint = "var(--faint)", accent = "var(--accent)";
  const c = centroid([...ring, ring[0]]);

  const dims = ring.map((p, i) => {
    const q = ring[(i + 1) % ring.length];
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (L < model.extent * 0.08) return null;
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    const ox = mx - c[0], oy = my - c[1], ol = Math.hypot(ox, oy) || 1;
    const lx = mx + (ox / ol) * fs * 1.4, ly = my + (oy / ol) * fs * 1.4;
    let ang = (Math.atan2(-(q[1] - p[1]), q[0] - p[0]) * 180) / Math.PI;
    if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
    return (
      <text key={i} x={X(lx)} y={Y(ly)} fontSize={fs} fill={faint} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${ang.toFixed(1)} ${X(lx).toFixed(2)} ${Y(ly).toFixed(2)})`} style={{ fontFamily: "var(--font-mono)" }}>
        {L.toFixed(1)} FT
      </text>
    );
  });
  const lots = model.lotA && model.lotB ? [model.lotA, model.lotB] : null;
  const scaleFt = model.extent > 120 ? 20 : 10;

  return (
    <svg viewBox={`0 0 ${W.toFixed(1)} ${H.toFixed(1)}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Technical drawing of the parcel with dimensions, split and setbacks" style={{ display: "block" }}>
      <defs>
        <pattern id="hatch" width={model.extent / 60} height={model.extent / 60} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={model.extent / 60} stroke="rgba(244,244,244,0.25)" strokeWidth={sw} />
        </pattern>
      </defs>
      {/* Grid every 10 ft */}
      {Array.from({ length: Math.ceil(W / 10) + 1 }, (_, i) => <line key={`gx${i}`} x1={i * 10} y1={0} x2={i * 10} y2={H} stroke="rgba(255,255,255,0.04)" strokeWidth={sw} />)}
      {Array.from({ length: Math.ceil(H / 10) + 1 }, (_, i) => <line key={`gy${i}`} x1={0} y1={i * 10} x2={W} y2={i * 10} stroke="rgba(255,255,255,0.04)" strokeWidth={sw} />)}
      <polygon points={pts(model.ring)} fill="none" stroke={ink} strokeWidth={sw * 2} />
      {lots && lots.map((l, i) => <polygon key={`sb${i}`} points={pts(inset(l, 4))} fill="none" stroke={faint} strokeWidth={sw} strokeDasharray={`${sw * 6} ${sw * 5}`} />)}
      {model.buildings.map((b, i) => <polygon key={`b${i}`} points={pts(b)} fill="url(#hatch)" stroke="rgba(244,244,244,0.55)" strokeWidth={sw} />)}
      {model.line && <line x1={X(model.line[0][0])} y1={Y(model.line[0][1])} x2={X(model.line[1][0])} y2={Y(model.line[1][1])} stroke={accent} strokeWidth={sw * 2.2} strokeDasharray={`${sw * 10} ${sw * 6}`} />}
      {lots && lots.map((l, i) => {
        const lc = centroid(l);
        return (
          <g key={`la${i}`} style={{ fontFamily: "var(--font-mono)" }}>
            <text x={X(lc[0])} y={Y(lc[1]) - fs * 0.7} fontSize={fs * 1.05} fill={ink} textAnchor="middle">LOT {i ? "B" : "A"}</text>
            <text x={X(lc[0])} y={Y(lc[1]) + fs * 0.8} fontSize={fs} fill={faint} textAnchor="middle">{Math.round(i ? model.areaB : model.areaA).toLocaleString()} SQ FT</text>
          </g>
        );
      })}
      {model.homes.map((h, i) => (
        <rect key={`h${i}`} x={X(h.x) - fs * 0.45} y={Y(h.y) + fs * 1.6} width={fs * 0.9} height={fs * 0.9} fill={h.existing ? "none" : accent} stroke={h.existing ? ink : "none"} strokeWidth={sw} opacity={0.9} />
      ))}
      {dims}
      {/* North arrow and scale */}
      <g style={{ fontFamily: "var(--font-mono)" }}>
        <line x1={W - fs * 1.6} y1={fs * 3.2} x2={W - fs * 1.6} y2={fs * 1.2} stroke={faint} strokeWidth={sw * 1.4} />
        <polyline points={`${W - fs * 2.1},${fs * 1.8} ${W - fs * 1.6},${fs * 1.2} ${W - fs * 1.1},${fs * 1.8}`} fill="none" stroke={faint} strokeWidth={sw * 1.4} />
        <text x={W - fs * 1.6} y={fs * 4.4} fontSize={fs} fill={faint} textAnchor="middle">N</text>
        <line x1={fs} y1={H - fs * 1.2} x2={fs + scaleFt} y2={H - fs * 1.2} stroke={faint} strokeWidth={sw * 1.4} />
        <text x={fs} y={H - fs * 2} fontSize={fs * 0.9} fill={faint}>{scaleFt} FT</text>
        {lots && <text x={W - fs} y={H - fs * 1.2} fontSize={fs * 0.85} fill={faint} textAnchor="end">DASHED: 4 FT LINE (SB 9 MAX SIDE/REAR SETBACK, HCD P.4). FRONT SETBACK: CITY RULE, NOT SHOWN</text>}
      </g>
    </svg>
  );
}
