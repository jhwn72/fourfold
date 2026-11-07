// CSV export of the citywide SB 9 candidate lots in data/citywide.json. Built as a static file.
import data from "../../../data/citywide.json";

export const dynamic = "force-static";

type Candidate = { apn: string; address: string; area_sqft: number; zone: string };

const esc = (v: unknown): string => {
  if (v == null) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function GET() {
  const cands = ((data as unknown as { candidates?: Candidate[] }).candidates ?? []);
  const rows = cands.map((c) => [c.apn, c.address, c.area_sqft, c.zone].map(esc).join(","));
  const body = ["apn,address,area_sqft,zone", ...rows].join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fourfold-santa-ana-citywide-candidates-2026-11-07.csv"',
    },
  });
}
