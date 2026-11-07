// Packs a citywide screen's points into public/city-points[-<city>].bin (Int16 x, Int16 y, Int16 code per parcel)
// plus a .json (bbox + counts), so the particle hero loads ~350 KB instead of several MB.
// Usage: npx tsx scripts/city-points.ts [anaheim|fullerton]   (no argument = Santa Ana, data/citywide.json)
import { readFileSync, writeFileSync } from "fs";
const arg = (process.argv[2] ?? "").toLowerCase();
const suffix = arg === "anaheim" || arg === "fullerton" ? `-${arg}` : "";
const d = JSON.parse(readFileSync(`data/citywide${suffix}.json`, "utf8"));
const pts: number[][] = d.points;
const buf = new Int16Array(pts.length * 3);
pts.forEach((p, i) => { buf[i * 3] = p[0]; buf[i * 3 + 1] = p[1]; buf[i * 3 + 2] = p[2]; });
writeFileSync(`public/city-points${suffix}.bin`, Buffer.from(buf.buffer));
writeFileSync(`public/city-points${suffix}.json`, JSON.stringify({ city: d.city ?? "Santa Ana", bbox: d.bbox, counts: d.counts, generated_at: d.generated_at, n: pts.length, note: d.note }));
console.log("wrote", pts.length, "points,", buf.byteLength, "bytes");
