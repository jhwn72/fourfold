// Quick checks for src/lib/areas.ts on the real data files. Run: npx tsx scripts/test-areas.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cityAreas, compareAreas, type AreaPoint } from "../src/lib/areas";
import { toClusterSite } from "../src/lib/clusters";
import type { SiteResult } from "../src/lib/types";

const read = (f: string) => JSON.parse(readFileSync(f, "utf8"));
const files: Record<string, string> = { "Santa Ana": "data/citywide.json", Anaheim: "data/citywide-anaheim.json", Fullerton: "data/citywide-fullerton.json" };
const pts = (rs: SiteResult[], city: string): AreaPoint[] => rs.map(toClusterSite).filter((s) => s && s.city === city).map((s) => ({ id: s!.id, x: s!.x, y: s!.y }));
const sale = read("data/results.json").results as SiteResult[];
const leads = read("data/leads-results.json").results as SiteResult[];
const pro = read("data/proactive-targets.json");

for (const [city, f] of Object.entries(files)) {
  const cw = read(f);
  const targets: AreaPoint[] = (pro.cities[city]?.targets ?? []).map((t: { apn: string; centroid_ft: [number, number] }) => ({ id: t.apn, x: t.centroid_ft[0], y: t.centroid_ft[1] }));
  const areas = cityAreas(city, cw.candidates, pts(sale, city), pts(leads, city), targets);
  assert.ok(areas.length > 0, `${city}: no areas`);
  assert.ok(areas.every((a) => a.city === city), `${city}: mixed cities`);
  for (let i = 1; i < areas.length; i++) assert.ok(compareAreas(areas[i - 1], areas[i]) <= 0, `${city}: not sorted`);
  for (const a of areas) {
    assert.equal(a.upToHomes, a.lots * 4);
    assert.ok(a.lots > 0 && a.cells.length >= 2);
    assert.ok(a.forSale.every((id) => sale.some((r) => r.id === id && r.city === city)));
    assert.ok(a.leads.every((id) => leads.some((r) => r.id === id && r.city === city)));
  }
  const total = areas.reduce((s, a) => s + a.lots, 0);
  assert.ok(total <= cw.counts.candidates, `${city}: area lots exceed the city's candidates`);
  console.log(city, areas.map((a) => `${a.label}: ${a.lots} lots, ${a.cells.length} cells, ${a.forSale.length} sale, ${a.leads.length} leads, ${a.targets.length} targets, span ${Math.round(a.spanFt)} ft`));
}
console.log("areas ok");
