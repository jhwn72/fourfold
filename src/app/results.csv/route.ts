// CSV export of data/results.json, one row per listing in ranked order (same order as the home page).
// Built as a static file. Values come straight from results.json; nothing is computed here except rank.
import { RESULTS } from "@/lib/results";
import { BRIEF_LAND_PER_HOME } from "@/lib/constants";
import type { SiteResult } from "@/lib/types";

export const dynamic = "force-static";

const esc = (v: unknown): string => {
  if (v == null) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const check = (r: SiteResult, id: string) => {
  const c = r.checks.find((x) => x.id === id);
  return c ? `${c.possible_fail ? "POSSIBLE FAIL" : c.status}: ${c.value}` : "";
};

const HEADER = [
  "rank", "id", "address", "city", "apn", "verdict", "verdict_reason", "max_homes", "asking_price",
  "land_cost_per_home", "brief_example_per_home_ASSUMPTION", "lot_sqft_city", "listed_lot_sqft",
  "zoning", "flood", "fire", "historic", "tenant_flag", "tenant_quote", "keep_house", "parking",
  "unknown_count", "listing_source_url", "date_collected", "computed_at",
];

export function GET() {
  const rows = RESULTS.results.map((r, i) => {
    const tenant = r.listing_evidence.flags.find((f) => f.flag === "tenant_occupied");
    return [
      i + 1, r.id, r.address, r.city, r.parcel?.apn ?? "", r.verdict, r.verdict_reason, r.max_homes ?? "", r.asking_price ?? "",
      r.land_cost_per_home ?? "", BRIEF_LAND_PER_HOME, r.parcel ? Math.round(r.parcel.area_sqft) : "", r.listed_lot_sqft ?? "",
      check(r, "zoning"), check(r, "flood"), check(r, "fire"), check(r, "historic"),
      tenant ? (tenant.present ? "yes" : "not stated") : "unknown", tenant?.quote ?? "", r.keep_house ?? "", check(r, "parking"),
      r.unknown_count, r.listing_source_url, r.date_collected, r.computed_at,
    ].map(esc).join(",");
  });
  const body = [HEADER.join(","), ...rows].join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fourfold-santa-ana-2026-11-07.csv"',
    },
  });
}
