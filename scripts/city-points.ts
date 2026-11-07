// Packs data/citywide.json points into public/city-points.bin (Int16 x, Int16 y, Int16 code per parcel)
// plus public/city-points.json (bbox + counts), so the particle hero loads ~350 KB instead of 2.7 MB.
import { readFileSync, writeFileSync } from "fs";
const d = JSON.parse(readFileSync("data/citywide.json", "utf8"));
const pts: number[][] = d.points;
const buf = new Int16Array(pts.length * 3);
pts.forEach((p, i) => { buf[i * 3] = p[0]; buf[i * 3 + 1] = p[1]; buf[i * 3 + 2] = p[2]; });
writeFileSync("public/city-points.bin", Buffer.from(buf.buffer));
writeFileSync("public/city-points.json", JSON.stringify({ bbox: d.bbox, counts: d.counts, generated_at: d.generated_at, n: pts.length }));
console.log("wrote", pts.length, "points,", buf.byteLength, "bytes");
