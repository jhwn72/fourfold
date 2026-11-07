// Quick checks for src/lib/clusters.ts. Run: npx tsx scripts/test-clusters.ts
// SYNTHETIC test-only coordinates, prices and addresses. Not real listings or data.
import assert from "node:assert/strict";
import { clusterSites, candidatePointsFeet, countWithin, zoneCode, type ClusterSite } from "../src/lib/clusters";

const site = (id: string, x: number, y: number, o: Partial<ClusterSite> = {}): ClusterSite => ({
  id, address: `TEST ${id}`, city: "Testville", verdict: "LIKELY YES", homes: 4, price: 800, zone: "R1", x, y, ...o,
});

// Three sites in a line 1,000 ft apart, one far away, one NO next door.
const sites = [
  site("a", 0, 0), site("b", 1000, 0), site("c", 2000, 0, { verdict: "UNKNOWN" }),
  site("far", 50000, 0), site("no", 10, 10, { verdict: "NO" }),
];

// Radius 2,640 ft: a, b, c all within 2,000 ft of each other -> one group of 12 homes.
let r = clusterSites(sites, 2640);
assert.equal(r.groups[0].members.length, 3);
assert.equal(r.groups[0].homes, 12);
assert.equal(r.groups[0].totalAsking, 2400);
assert.equal(r.groups[0].avgPerHome, 200);
assert.equal(r.groups[0].spreadFt, 2000);
assert.equal(r.groups[0].unknownCount, 1);
assert.equal(r.groups[0].label, "Group A");
assert.deepEqual(r.excluded.map((s) => s.id), ["no"]);
assert.equal(r.groups[1].members[0].id, "far"); // singleton ranked after the real group
assert.equal(r.nearest.far?.id, "c");
assert.equal(r.nearest.far?.distFt, 48000);

// Radius 1,500 ft: complete linkage, no chaining; a-c are 2,000 ft apart so they cannot share a group.
r = clusterSites(sites, 1500);
assert.ok(r.groups.every((g) => g.spreadFt <= 1500));
assert.equal(r.groups[0].members.length, 2);

// Mixed cities are ranked after a single-city group even with more homes.
const mixed = [
  site("m1", 0, 0, { city: "X" }), site("m2", 100, 0, { city: "Y" }), site("m3", 200, 0, { city: "Y" }),
  site("s1", 90000, 0), site("s2", 90100, 0),
];
r = clusterSites(mixed, 2640);
assert.deepEqual(r.groups[0].cities, ["Testville"]);
assert.equal(r.groups[1].cities.length, 2);

// Unknown price -> avg per home UNKNOWN (null), total counts known prices only.
r = clusterSites([site("p1", 0, 0), site("p2", 10, 0, { price: null })], 2640);
assert.equal(r.groups[0].avgPerHome, null);
assert.equal(r.groups[0].priceUnknown, 1);

// Citywide point conversion and radius count.
const pts = candidatePointsFeet([1000, 2000, 0, 0], [[0, 0, 1], [10, 0, 1], [0, 0, 0], [500, 0, 1]]);
assert.deepEqual(pts, [[1000, 2000], [1100, 2000], [6000, 2000]]);
assert.equal(countWithin(pts, 1000, 2000, 100), 2);
r = clusterSites([site("q", 1000, 2000)], 150, pts);
assert.equal(r.groups[0].nearbyCandidates, 2);

assert.equal(zoneCode("R1 (Single-Family Residence)"), "R1");
assert.equal(zoneCode(undefined), null);
console.log("test-clusters: all passed");
