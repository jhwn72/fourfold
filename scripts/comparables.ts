/**
 * Recent SB 9 projects in Orange County, from HCD Housing Element Annual Progress Report (APR) data.
 *
 * Source: data.ca.gov, "Housing Element Annual Progress Report (APR) Data by Jurisdiction and Year"
 *   https://data.ca.gov/@california-department-of-housing-and-community-development/housing-element-annual-progress-report-apr-data-by-jurisdiction-and-year
 *   Table A2 (building activity: entitlements, permits, certificates of occupancy) fe505d9b-8c36-42ba-ba30-08bc4f34e022
 *   Table A  (housing development applications)                                c78b769d-cc02-4050-91ef-79ded665b5a8
 * Checked 2026-11-07.
 *
 * IMPORTANT: Neither table has an SB 9 column (field lists checked 2026-11-07). We find SB 9 projects
 * by searching the free-text NOTES, PROJECT_NAME and JURS_TRACKING_ID fields for "SB 9" / "SB9" /
 * "lot split" / "Senate Bill 9". So this only finds projects that a city chose to label. A city that
 * does not label them (Santa Ana, for example) shows zero here even if it has SB 9 projects.
 *
 * Privacy: PROJECT_NAME and NOTES are used only to match; neither is written to the output.
 * Gentle on the server: 2 SQL queries, cached in .cache/comparables/ (gitignored). Use --refresh to refetch.
 *
 * Run: npm run comparables
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHECKED = "2026-11-07";
const DATASET_URL =
  "https://data.ca.gov/@california-department-of-housing-and-community-development/housing-element-annual-progress-report-apr-data-by-jurisdiction-and-year";
const A2 = "fe505d9b-8c36-42ba-ba30-08bc4f34e022";
const A = "c78b769d-cc02-4050-91ef-79ded665b5a8";
const CACHE = join(process.cwd(), ".cache", "comparables");
const REFRESH = process.argv.includes("--refresh");

// Order matters: Santa Ana first, then the nearby cities named by the team, then the rest of OC.
const PRIORITY = [
  "SANTA ANA", "ANAHEIM", "GARDEN GROVE", "COSTA MESA", "FULLERTON", "IRVINE", "ORANGE",
  "TUSTIN", "WESTMINSTER", "HUNTINGTON BEACH",
];

type Row = Record<string, string | number | null>;

function where(): string {
  const cols = ["NOTES", "PROJECT_NAME", "JURS_TRACKING_ID"];
  const pats = ["%SB 9%", "%SB9%", "%SB-9%", "%lot split%", "%senate bill 9%", "%urban lot%"];
  return cols.map((c) => "(" + pats.map((p) => `"${c}" ILIKE '${p}'`).join(" OR ") + ")").join(" OR ");
}

async function sql(name: string, query: string): Promise<Row[]> {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${name}.json`);
  if (!REFRESH && existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const url = "https://data.ca.gov/api/3/action/datastore_search_sql?sql=" + encodeURIComponent(query);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const body = (await res.json()) as { success: boolean; result: { records: Row[] } };
  if (!body.success) throw new Error(`${name}: API error`);
  writeFileSync(file, JSON.stringify(body.result.records));
  return body.result.records;
}

const str = (v: unknown) => (v == null ? "" : String(v)).trim();
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

// Strict check after the broad SQL match: "SB 94" or "SB 900" must not count.
const SB9_RE = /\bSB[\s-]?9\b|\bsenate bill 9\b|\blot split\b|\burban lot split\b/i;
function evidence(r: Row): string | null {
  if (/^SB9/i.test(str(r.JURS_TRACKING_ID)) || SB9_RE.test(str(r.JURS_TRACKING_ID))) return "tracking ID labeled SB 9";
  if (SB9_RE.test(str(r.NOTES))) return "notes mention SB 9";
  if (SB9_RE.test(str(r.PROJECT_NAME))) return "project name mentions SB 9";
  return null;
}

// Rows that mention SB 9 but are not an SB 9 unit or split: ADU rows ("ADU attached to (N) SB9")
// and Westminster's boilerplate note listing ADUs alongside SB 9 units.
function excludeReason(r: Row): string | null {
  if (str(r.UNIT_CAT) === "ADU") return "unit category is ADU (row mentions SB 9 but reports an ADU)";
  return null;
}

const INCOME = [
  ["acutely_low", "ACUTELY_LOW_INCOME"], ["extremely_low", "EXTREMELY_LOW_INCOME"],
  ["very_low", "VLOW_INCOME"], ["low", "LOW_INCOME"], ["moderate", "MOD_INCOME"],
] as const;
function income(r: Row, prefix: string) {
  const out: Record<string, number> = {};
  for (const [k, f] of INCOME) {
    const n = num(r[`${prefix}${f}_DR`]) + num(r[`${prefix}${f}_NDR`]);
    if (n) out[k] = n;
  }
  const am = num(r[`${prefix}ABOVE_MOD_INCOME`]);
  if (am) out.above_moderate = am;
  return out;
}

type Project = {
  jurisdiction: string;
  county: string;
  year: number; // latest APR reporting year this project appears in
  years_reported: number[];
  address: string;
  apn: string;
  tracking_id: string;
  units: number | null;
  unit_type: string;
  tenure: string;
  income: Record<string, number>;
  dates: { application_submitted?: string; entitled?: string; permitted?: string; completed?: string };
  application_status?: string;
  lot_split: boolean | null;
  sb9_evidence: string[];
  tables: string[];
};

function key(r: Row) {
  const apn = str(r.APN).replace(/[^0-9A-Za-z]/g, "");
  return `${str(r.JURIS_NAME)}|${apn || str(r.STREET_ADDRESS).toUpperCase()}`;
}
function cleanAddr(s: string) {
  return s.split("\n")[0].replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
}

async function main() {
  const base = `WHERE "CNTY_NAME"='Orange' AND (${where()})`;
  const a2 = await sql("a2_oc_sb9", `SELECT * FROM "${A2}" ${base}`);
  const a = await sql("a_oc_sb9", `SELECT * FROM "${A}" ${base}`);

  const map = new Map<string, Project>();
  const excluded: Record<string, number> = {};
  const get = (r: Row): Project => {
    const k = key(r);
    let p = map.get(k);
    if (!p) {
      p = {
        jurisdiction: str(r.JURIS_NAME), county: str(r.CNTY_NAME), year: num(r.YEAR), years_reported: [],
        address: cleanAddr(str(r.STREET_ADDRESS)), apn: str(r.APN), tracking_id: cleanAddr(str(r.JURS_TRACKING_ID)),
        units: null, unit_type: str(r.UNIT_CAT), tenure: str(r.TENURE), income: {}, dates: {},
        lot_split: null, sb9_evidence: [], tables: [],
      };
      map.set(k, p);
    }
    const y = num(r.YEAR);
    if (!p.years_reported.includes(y)) p.years_reported.push(y);
    p.year = Math.max(p.year, y);
    if (!p.tenure && r.TENURE) p.tenure = str(r.TENURE);
    return p;
  };
  const note = (p: Project, r: Row, table: string, ev: string) => {
    if (!p.sb9_evidence.includes(ev)) p.sb9_evidence.push(ev);
    if (!p.tables.includes(table)) p.tables.push(table);
    if (/lot split/i.test(str(r.NOTES)) || /^ULS/i.test(str(r.JURS_TRACKING_ID))) p.lot_split = true;
  };

  for (const r of a2) {
    const ev = evidence(r);
    const ex = excludeReason(r);
    if (!ev || ex) { const why = ex ?? "no strict SB 9 match"; excluded[why] = (excluded[why] ?? 0) + 1; continue; }
    const p = get(r);
    note(p, r, "A2", ev);
    const d = p.dates;
    if (r.ENT_APPROVE_DT1) d.entitled = d.entitled && d.entitled < str(r.ENT_APPROVE_DT1) ? d.entitled : str(r.ENT_APPROVE_DT1);
    if (r.BP_ISSUE_DT1) d.permitted = d.permitted && d.permitted < str(r.BP_ISSUE_DT1) ? d.permitted : str(r.BP_ISSUE_DT1);
    if (r.CO_ISSUE_DT1) d.completed = d.completed && d.completed > str(r.CO_ISSUE_DT1) ? d.completed : str(r.CO_ISSUE_DT1);
    const u = Math.max(num(r.NO_ENTITLEMENTS), num(r.NO_BUILDING_PERMITS), num(r.NO_OTHER_FORMS_OF_READINESS));
    if (u) p.units = Math.max(p.units ?? 0, u);
    const inc = num(r.NO_BUILDING_PERMITS) ? income(r, "BP_") : num(r.NO_ENTITLEMENTS) ? income(r, "") : income(r, "CO_");
    if (Object.keys(inc).length) p.income = inc;
  }
  for (const r of a) {
    const ev = evidence(r);
    const ex = excludeReason(r);
    if (!ev || ex) { const why = ex ?? "no strict SB 9 match"; excluded[why] = (excluded[why] ?? 0) + 1; continue; }
    const p = get(r);
    note(p, r, "A", ev);
    if (r.APP_SUBMIT_DT) p.dates.application_submitted = str(r.APP_SUBMIT_DT);
    if (r.APPLICATION_STATUS) p.application_status = str(r.APPLICATION_STATUS);
    if (p.units == null && num(r.TOT_PROPOSED_UNITS)) p.units = num(r.TOT_PROPOSED_UNITS);
    if (!Object.keys(p.income).length) p.income = income(r, "");
  }

  const rank = (j: string) => { const i = PRIORITY.indexOf(j); return i === -1 ? PRIORITY.length : i; };
  const latest = (p: Project) => p.dates.completed ?? p.dates.permitted ?? p.dates.entitled ?? p.dates.application_submitted ?? "";
  const projects = [...map.values()]
    .map((p) => ({ ...p, years_reported: p.years_reported.sort() }))
    .sort((x, y) => rank(x.jurisdiction) - rank(y.jurisdiction) || y.year - x.year || latest(y).localeCompare(latest(x)))
    .slice(0, 300);

  const byCity: Record<string, Record<string, number>> = {};
  for (const p of projects) {
    byCity[p.jurisdiction] ??= {};
    byCity[p.jurisdiction][p.year] = (byCity[p.jurisdiction][p.year] ?? 0) + 1;
  }

  const out = {
    generated_at: new Date().toISOString(),
    source: {
      name: "HCD Housing Element Annual Progress Report (APR) data, Tables A and A2 (data.ca.gov)",
      url: DATASET_URL,
      resource_id: { table_a2: A2, table_a: A },
      checked: CHECKED,
    },
    context: {
      name: "Terner Center, California's HOME Act Turns One: Data and Insights from the First Year of Senate Bill 9 (published 2023-01-18)",
      url: "https://ternercenter.berkeley.edu/research-and-policy/sb-9-turns-one-applications/",
      checked: CHECKED,
      finding: "Surveyed 13 California jurisdictions on 2022 SB 9 activity; San Diego reported 7 applications for new SB 9 units and Los Angeles 211.",
    },
    field_notes: [
      "APR Tables A and A2 have no SB 9 field (field lists checked 2026-11-07). Projects were found by text search of NOTES, PROJECT_NAME and JURS_TRACKING_ID for SB 9 / SB9 / lot split / Senate Bill 9.",
      "Cities that do not label SB 9 projects in these fields show zero here. Santa Ana reports APR building activity every year (2022 to 2025) but no row is labeled SB 9, so Santa Ana's SB 9 count is UNKNOWN, not zero.",
      "The data does not reliably separate SB 9 lot splits from SB 9 second units or duplexes. lot_split is true only when the row says so; otherwise null (unknown).",
      "Rows with unit category ADU that only mention SB 9 were excluded. Owner, applicant and project names are not included.",
      "Table A = applications received; Table A2 = entitlements, building permits and certificates of occupancy. One project can appear in both and across years; rows are merged by jurisdiction and APN.",
      "units is the count the city reported for this record (usually the 1 new SB 9 unit), not the total homes on the lot after the project.",
      "'year' is the latest APR reporting year the project appears in. Dates are as reported by the city.",
      "ORANGE COUNTY means unincorporated Orange County (some have Santa Ana or Midway City mailing addresses).",
    ],
    excluded_rows: excluded,
    counts_by_city_year: byCity,
    projects,
  };
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(join(process.cwd(), "data", "comparables.json"), JSON.stringify(out, null, 2) + "\n");

  console.log(`Raw matches: A2 ${a2.length}, A ${a.length}. Excluded:`, excluded);
  console.log(`Projects written: ${projects.length}`);
  for (const [c, ys] of Object.entries(byCity)) console.log(`  ${c.padEnd(18)} ${Object.entries(ys).map(([y, n]) => `${y}:${n}`).join("  ")}`);
  console.log(`  SANTA ANA          0 labeled (UNKNOWN; city does not label SB 9 in APR text fields)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
