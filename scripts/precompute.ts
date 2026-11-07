// Run every check and the Claude listing read for each entry in data/listings.json,
// and write data/results.json (ranked). Run locally and commit the output.
// Raw API responses are cached in .cache/ so reruns do not hit government servers again.
import { promises as fs } from "fs";
import path from "path";
import { readListing } from "../src/lib/listing-reader";
import { checkSite, rank, type ListingInput } from "../src/lib/sb9";

process.env.FOURFOLD_CACHE = "1";

async function loadEnv() {
  try {
    const txt = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

async function main() {
  await loadEnv();
  const listings: (ListingInput & { listed_lot_sqft?: number | null; description_type?: string })[] = JSON.parse(
    await fs.readFile("data/listings.json", "utf8")
  );
  const results = [];
  for (const l of listings) {
    const evidence = await readListing(l.description ?? "");
    const r = await checkSite(l, evidence);
    results.push({ ...r, listed_lot_sqft: l.listed_lot_sqft ?? null, description: l.description ?? "", description_type: l.description_type ?? null });
    console.log(`${l.id.padEnd(6)} ${r.verdict.padEnd(10)} homes=${r.max_homes} perHome=${r.land_cost_per_home} unknowns=${r.unknown_count} reader=${evidence.status} | ${r.verdict_reason}`);
    await new Promise((res) => setTimeout(res, 300)); // be gentle with public servers
  }
  const ranked = rank(results);
  await fs.writeFile("data/results.json", JSON.stringify({ generated_at: new Date().toISOString(), city: "Santa Ana", results: ranked }, null, 1));
  console.log(`\nWrote data/results.json with ${ranked.length} sites.`);
}
main();
