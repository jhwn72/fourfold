// Quick checks for src/lib/fund.ts. Run: npx tsx scripts/test-fund.ts
// Test numbers are arbitrary inputs, not data.
import assert from "node:assert/strict";
import { computeGap, donationImpact, parseMoney, type CostLine } from "../src/lib/fund";

const lines = (construction: number | null): CostLine[] => [
  { key: "land", label: "Land and building purchase", amount: 1000 },
  { key: "build", label: "New construction", amount: construction },
  { key: "time", label: "Time costs", amount: 200 },
  { key: "fees", label: "Fees, design, legal, sales", amount: 100 },
];

// covered
let g = computeGap(lines(500), [1500, 400, null]);
assert.equal(g.totalCost, 1800);
assert.equal(g.totalFunding, 1900);
assert.equal(g.covered, true);
assert.equal(g.spare, 100);
assert.equal(donationImpact(g, 50, 4), null);

// gap: 1800 cost, 1500 funding -> 300 gap; land+build covered, time 200 + fees 100 uncovered
g = computeGap(lines(500), [1500]);
assert.equal(g.gap, 300);
assert.equal(g.covered, false);
assert.deepEqual(g.lines.map((l) => l.uncovered), [0, 0, 200, 100]);
let d = donationImpact(g, 240, 4)!;
assert.equal(d.sharePct, 80);
assert.equal(d.closesGap, false);
assert.match(d.words, /fully pays the remaining time costs line and covers 40% of the remaining fees, design, legal, sales line/);
assert.equal(d.gapPerHome, 75);
d = donationImpact(g, 300, 4)!;
assert.equal(d.closesGap, true);
assert.equal(d.words, "closes the gap");

// blank construction -> UNKNOWN
g = computeGap(lines(null), [5000]);
assert.equal(g.totalCost, null);
assert.equal(g.gap, null);
assert.equal(g.covered, false);
assert.equal(donationImpact(g, 100, 4), null);

assert.equal(parseMoney(""), null);
assert.equal(parseMoney("$1,250,000"), 1250000);
assert.equal(parseMoney("abc"), null);

console.log("test-fund: all assertions passed");
