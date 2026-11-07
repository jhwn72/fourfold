// Draws the landing tunnel's cards to canvases: real listing parcels (outline, split line, lots,
// existing building) and dot snippets of the city (amber = passes the first SB 9 screen).
// Coordinates are State Plane CA VI feet (wkid 2230); city points are 10 ft units from bbox min.

export type TileListing = {
  n: number;
  address: string;
  verdict: string;
  homes: number;
  ring: number[][];
  line: number[][] | null;
  lots: number[][][] | null;
  buildings: number[][][];
};

export type CityPoints = { xs: Int16Array; ys: Int16Array; codes: Int16Array; n: number };

export type Palette = { card: string; edge: string; ink: string; soft: string; faint: string; accent: string; lotFill: string };

export const TILE_W = 320;
export const TILE_H = 400;

export function paletteFor(theme: "dark" | "light", accent: string): Palette {
  return theme === "dark"
    ? { card: "#0e0e0e", edge: "rgba(255,255,255,0.10)", ink: "rgba(240,240,240,0.92)", soft: "rgba(240,240,240,0.55)", faint: "rgba(240,240,240,0.22)", accent, lotFill: "rgba(255,255,255,0.035)" }
    : { card: "#ffffff", edge: "rgba(0,0,0,0.10)", ink: "rgba(17,17,17,0.92)", soft: "rgba(17,17,17,0.55)", faint: "rgba(17,17,17,0.22)", accent, lotFill: "rgba(0,0,0,0.03)" };
}

export function decodeCity(buf: ArrayBuffer): CityPoints {
  const a = new Int16Array(buf);
  const n = Math.floor(a.length / 3);
  const xs = new Int16Array(n), ys = new Int16Array(n), codes = new Int16Array(n);
  for (let i = 0; i < n; i++) { xs[i] = a[i * 3]; ys[i] = a[i * 3 + 1]; codes[i] = a[i * 3 + 2]; }
  return { xs, ys, codes, n };
}

function blank(p: Palette, mono: string) {
  const c = document.createElement("canvas");
  c.width = TILE_W; c.height = TILE_H;
  const g = c.getContext("2d")!;
  g.fillStyle = p.card;
  roundRect(g, 0, 0, TILE_W, TILE_H, 10); g.fill();
  g.strokeStyle = p.edge; g.lineWidth = 2;
  roundRect(g, 1, 1, TILE_W - 2, TILE_H - 2, 9); g.stroke();
  g.font = `400 13px ${mono}`;
  g.textBaseline = "alphabetic";
  return { c, g };
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function fitText(g: CanvasRenderingContext2D, s: string, max: number) {
  if (g.measureText(s).width <= max) return s;
  while (s.length > 3 && g.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}

/** One listing: real parcel outline normalized to the tile, split line and lots when it can hold 4 homes. */
export function drawListing(l: TileListing, p: Palette, mono: string): HTMLCanvasElement {
  const { c, g } = blank(p, mono);
  const pad = 30, top = 62, bottom = 92;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of l.ring) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const bw = TILE_W - pad * 2, bh = TILE_H - top - bottom;
  const s = Math.min(bw / (maxX - minX), bh / (maxY - minY));
  const ox = pad + (bw - (maxX - minX) * s) / 2, oy = top + (bh - (maxY - minY) * s) / 2;
  const tx = (x: number) => ox + (x - minX) * s;
  const ty = (y: number) => oy + (maxY - y) * s; // north up
  const path = (ring: number[][]) => {
    g.beginPath();
    ring.forEach(([x, y], i) => (i ? g.lineTo(tx(x), ty(y)) : g.moveTo(tx(x), ty(y))));
    g.closePath();
  };

  if (l.lots) {
    l.lots.forEach((lot, i) => { path(lot); g.fillStyle = i ? p.lotFill : "transparent"; g.fill(); });
  }
  for (const b of l.buildings) { path(b); g.fillStyle = p.faint; g.fill(); }
  path(l.ring); g.strokeStyle = p.ink; g.lineWidth = 2; g.stroke();
  if (l.line) {
    g.save();
    g.setLineDash([7, 6]); g.strokeStyle = p.accent; g.lineWidth = 2;
    g.beginPath(); g.moveTo(tx(l.line[0][0]), ty(l.line[0][1])); g.lineTo(tx(l.line[1][0]), ty(l.line[1][1])); g.stroke();
    g.restore();
  }

  g.fillStyle = p.soft;
  g.font = `400 13px ${mono}`;
  g.fillText(`№${l.n}`, pad, 40);
  g.textAlign = "right";
  g.fillStyle = l.verdict === "LIKELY YES" ? p.accent : p.soft;
  g.fillText(l.verdict, TILE_W - pad, 40);
  g.textAlign = "left";
  g.fillStyle = p.ink;
  g.font = `400 14px ${mono}`;
  g.fillText(fitText(g, l.address.toUpperCase(), TILE_W - pad * 2), pad, TILE_H - 52);
  g.font = `400 13px ${mono}`;
  g.fillStyle = l.homes > 0 ? p.accent : p.soft;
  g.fillText(l.homes > 0 ? `${l.homes} HOMES` : "NO SPLIT", pad, TILE_H - 30);
  return c;
}

/** A square crop of the city around a center (10 ft units from bbox min); amber dots pass the first screen. */
export function drawCity(city: CityPoints, cx: number, cy: number, half: number, label: string, p: Palette, mono: string): HTMLCanvasElement {
  const { c, g } = blank(p, mono);
  const pad = 22, top = 56, bottom = 70;
  const bw = TILE_W - pad * 2, bh = TILE_H - top - bottom;
  const halfX = half, halfY = half * (bh / bw);
  const s = bw / (halfX * 2);
  let total = 0, cand = 0;
  for (let i = 0; i < city.n; i++) {
    const dx = city.xs[i] - cx, dy = city.ys[i] - cy;
    if (dx < -halfX || dx > halfX || dy < -halfY || dy > halfY) continue;
    total++;
    const isCand = city.codes[i] === 1;
    if (isCand) cand++;
    g.fillStyle = isCand ? p.accent : p.faint;
    const px = pad + (dx + halfX) * s, py = top + (halfY - dy) * s;
    g.fillRect(px - 1.3, py - 1.3, 2.6, 2.6);
  }
  g.font = `400 13px ${mono}`;
  g.fillStyle = p.soft;
  g.fillText("SANTA ANA", pad, 38);
  g.textAlign = "right";
  g.fillText(label, TILE_W - pad, 38);
  g.textAlign = "left";
  g.fillStyle = p.ink;
  g.fillText(`${total.toLocaleString("en-US")} PARCELS`, pad, TILE_H - 40);
  g.fillStyle = p.accent;
  g.textAlign = "right";
  g.fillText(`${cand.toLocaleString("en-US")} PASS SCREEN`, TILE_W - pad, TILE_H - 40);
  g.textAlign = "left";
  return c;
}

/** A soft copy for cards close to the camera (downscale then upscale: works in every browser). */
export function blurred(src: HTMLCanvasElement): HTMLCanvasElement {
  const small = document.createElement("canvas");
  small.width = 22; small.height = 28;
  small.getContext("2d")!.drawImage(src, 0, 0, 22, 28);
  const out = document.createElement("canvas");
  out.width = 160; out.height = 200;
  const g = out.getContext("2d")!;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(small, 0, 0, 160, 200);
  return out;
}
