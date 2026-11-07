// Run the SB 9 checks on the unverified Anaheim and Fullerton leads in data/leads.json and write
// data/leads-results.json (same shape as results.json plus the lead fields, ranked with rank()).
// No Claude listing read: there is no verified listing text, so the tenant test stays UNKNOWN.
// Usage: npx tsx scripts/leads.ts
import { promises as fs } from "fs";
import type { SiteResult } from "../src/lib/types";

process.env.FOURFOLD_CACHE = "1";

type Lead = { id: string; address: string; city: string; asking_price: null; listing_status: string; lead_note: string; source: string; date_collected: string; listed_lot_sqft: number | null; stale_warning?: string };

async function main() {
  const { checkSite, rank } = await import("../src/lib/sb9");
  const file = JSON.parse(await fs.readFile("data/leads.json", "utf8"));
  const leads: Lead[] = file.leads;
  const results: (SiteResult & Record<string, unknown>)[] = [];
  for (const l of leads) {
    const r = await checkSite({ id: l.id, address: l.address, city: l.city, asking_price: null, date_collected: l.date_collected });
    const flags: string[] = [];
    const pc = r.checks.find((c) => c.id === "parcel");
    if (!r.parcel) flags.push("address did not match a parcel");
    else {
      if (pc && /parcel records match/.test(pc.note)) flags.push("address matches several parcel records; confirm the APN");
      const a = r.parcel.area_sqft;
      const other = l.listed_lot_sqft ?? r.parcel.assessor_area_sqft;
      if (other && Math.abs(a - other) / other > 0.2) flags.push(`GIS parcel area ${Math.round(a).toLocaleString()} sq ft differs by more than 20% from ${l.listed_lot_sqft ? "the snippet lot size" : "the assessor lot area"} ${Math.round(other).toLocaleString()} sq ft`);
    }
    if (l.stale_warning) flags.push(l.stale_warning);
    results.push({ ...r, listing_status: l.listing_status, lead_note: l.lead_note, lead_source: l.source, listed_lot_sqft: l.listed_lot_sqft, stale_warning: l.stale_warning ?? null, data_flags: flags, description: "", description_type: null });
    console.log(`${l.id.padEnd(9)} ${r.verdict.padEnd(10)} ${r.parcel?.apn ?? "-"} homes=${r.max_homes} | ${r.verdict_reason}${flags.length ? " | FLAGS: " + flags.join("; ") : ""}`);
    await new Promise((res) => setTimeout(res, 300)); // be gentle with public servers
  }
  const ranked = rank(results as SiteResult[]);
  const counts = { total: ranked.length, "LIKELY YES": 0, UNKNOWN: 0, NO: 0, not_found: ranked.filter((r) => !r.parcel).length } as Record<string, number>;
  for (const r of ranked) counts[r.verdict]++;
  await fs.writeFile("data/leads-results.json", JSON.stringify({
    generated_at: new Date().toISOString(),
    cities: ["Anaheim", "Fullerton"],
    note: "Unverified leads, not confirmed listings. asking_price is null because snippet prices were not confirmed on a live listing page. Historic status is UNKNOWN: no city historic layer was checked for Anaheim or Fullerton. Zoning code lists are in src/lib/cities.ts (ASSUMPTION where judged).",
    source: file.source,
    counts,
    results: ranked,
  }, null, 1));
  console.log("\n" + JSON.stringify(counts));
}
main().catch((e) => { console.error(e); process.exit(1); });
