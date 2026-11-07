// "What's next": the steps after an organization picks a site, specialized by that site's checks.
// Pure module (no fs, no React). Every time estimate carries a source; otherwise it says UNKNOWN.
// FourFold drafts letters and emails; it never sends anything. Not legal or financial advice.
import comparables from "../../data/comparables.json";
import { buildCallSheet } from "./callsheet";
import { STAGES, validateOutcome, type OutcomeRecord, type StageKey, type Validation } from "./outcomes";
import type { CheckResult, SiteResult } from "./types";

export type Cite = { label: string; url: string; checked: string };
export type Estimate = { text: string; cite: Cite } | { text: "UNKNOWN"; cite?: undefined };
export type Draft = { label: string; text: string };
export type RoadStep = {
  key: string;
  title: string;
  todo: string[];
  who: string[]; // roles only, never a person
  time: Estimate[];
  knows: string[]; // what FourFold already knows for this site
  open: string[]; // what is still open for this site
  drafts: Draft[];
  cites: Cite[];
  /** Outcome-record stages this step can date (see src/lib/outcomes.ts STAGES). */
  stages: StageKey[];
};
export type Roadmap = { siteId: string; warning: string | null; steps: RoadStep[] };

export const HCD_APR_2026: Cite = { label: "HCD SB 9 fact sheet (April 2026)", url: "https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/lot-splits-and-duplexes-sb-9.pdf", checked: "2026-11-07" };
export const HCD_SEP_2024: Cite = { label: "HCD SB 9 Fact Sheet (Sept 2024)", url: "https://www.hcd.ca.gov/sites/default/files/docs/planning-and-community/sb-9-fact-sheet.pdf", checked: "2026-11-07" };
const HCD_INCOME: Cite = { label: "HCD State Income Limits (2026, revised June 23, 2026)", url: "https://www.hcd.ca.gov/grants-and-funding/income-limits", checked: "2026-11-07" };
const HSC_50052_5: Cite = { label: "Health and Safety Code 50052.5 (affordable housing cost)", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=HSC&sectionNum=50052.5", checked: "2026-11-07" };
const APR: Cite = { label: "HCD Housing Element APR data, Tables A and A2", url: comparables.source.url, checked: comparables.source.checked };

const UNKNOWN: Estimate = { text: "UNKNOWN" };

/** Median months from building permit to completion over OC SB 9 projects reporting both (same math as Comparables.tsx). */
export function buildTiming() {
  type P = { dates?: { permitted?: string | null; completed?: string | null } };
  const xs = (comparables.projects as P[])
    .filter((p) => p.dates?.permitted && p.dates?.completed)
    .map((p) => (Date.parse(p.dates!.completed!) - Date.parse(p.dates!.permitted!)) / 86400000)
    .filter((x) => x >= 0)
    .sort((a, b) => a - b);
  if (!xs.length) return null;
  const m = xs.length % 2 ? xs[(xs.length - 1) / 2] : (xs[xs.length / 2 - 1] + xs[xs.length / 2]) / 2;
  return { n: xs.length, total: comparables.projects.length, medianMonths: Math.round((m / 30.44) * 10) / 10 };
}

const find = (r: SiteResult, id: string) => r.checks.find((c) => c.id === id);
const isOpen = (c?: CheckResult) => !c || c.status === "UNKNOWN" || !!c.possible_fail;
const known = (r: SiteResult, id: string, say: string) => {
  const c = find(r, id);
  return c && c.status === "PASS" && !c.possible_fail ? `${say} (${c.source_name}, checked ${c.checked_at.slice(0, 10)})` : null;
};
const openNote = (r: SiteResult, id: string, say: string) => {
  const c = find(r, id);
  if (!c) return `${say}: UNKNOWN`;
  if (c.possible_fail) return `${say}: possible FAIL. ${c.next_step ?? c.note}`;
  if (c.status === "UNKNOWN") return `${say}: UNKNOWN. ${c.next_step ?? ""}`.trim();
  if (c.status === "FAIL") return `${say}: FAIL. ${c.value}`;
  return null;
};
const nn = <T,>(xs: (T | null | undefined | false)[]) => xs.filter(Boolean) as T[];
const usd = (n: number | null) => (n == null ? "[price]" : "$" + n.toLocaleString("en-US"));

export function buildRoadmap(r: SiteResult): Roadmap {
  const sheet = buildCallSheet(r);
  const apn = r.parcel?.apn ?? "UNKNOWN";
  const t = buildTiming();
  const homes = r.max_homes;
  const split = r.split;

  const warning =
    r.verdict === "NO"
      ? "FourFold says NO for this site. These steps assume a site that passes SB 9; fix or confirm the failing test first."
      : r.verdict === "UNKNOWN"
        ? "FourFold could not confirm this site. Settle the open questions before spending money."
        : null;

  const loi = `DRAFT LETTER OF INTENT (not an offer; not legal advice; have a real estate attorney review)

Property: ${r.address}, ${r.city}, CA (APN ${apn})
Buyer: [Organization], a nonprofit housing developer
Proposed price: ${usd(r.asking_price)} [confirm]

1. Inspection period: [number] days after acceptance to inspect the property and review title, survey and city records.
2. SB 9 feasibility contingency: Buyer may cancel and recover its deposit if, within the inspection period, Buyer cannot confirm that the property qualifies for an SB 9 urban lot split and two-unit development (Gov. Code 65852.21 and 66411.7), including: no tenant in the last 3 years, no rent restriction or rent control, no prior SB 9 split, not a historic resource, and not on an excluded site.
3. Seller disclosures: rental and occupancy history for the last 3 years, any recorded covenants, and any notices from the city.
4. Deposit: [amount] into escrow, refundable during the inspection period.
5. Closing: [number] days after the contingency is removed.
6. Buyer is a nonprofit. HCD says nonprofits are exempt from the owner-occupancy affidavit (HCD SB 9 fact sheet, April 2026, p.2).

This letter is not binding except for [confidentiality], and no agreement exists until a purchase contract is signed.

[Name], [Title]
[Organization]`;

  const survey = `Subject: Survey and lot split feasibility request, ${r.address}

Hello,

We are a nonprofit housing developer evaluating ${r.address}, ${r.city} (APN ${apn}) for an SB 9 urban lot split. Could you quote and schedule:

1. A boundary and topographic survey.
2. A check of a split line that gives two lots of at least 1,200 sq ft each${split ? ` (our desktop sketch: about ${split.lot_a_sqft.toLocaleString("en-US")} and ${split.lot_b_sqft.toLocaleString("en-US")} sq ft, from public parcel lines, not a survey)` : ""}.
3. Access to the street for the rear lot, and where utilities would run.
4. ${r.keep_house === "fits_a" || r.keep_house === "fits_b" ? "Confirmation that the existing house stays on one lot." : "Whether the existing house can stay on one lot."}
5. The parcel map preparation for the city's SB 9 application, if we go ahead.

Please include your fee and timing in the quote.

Thank you,
[Your name]
[Organization]`;

  const cityQs = sheet.groups.filter(([who]) => /planning|housing/i.test(who)).flatMap(([, qs]) => qs.map((q) => q.question));
  const preApp = `Subject: Pre-application questions, SB 9 lot split at ${r.address}

Hello,

Our organization is a nonprofit housing developer considering an SB 9 urban lot split and two-unit development at ${r.address} (APN ${apn}). Before we apply, could we set up a short pre-application meeting, or could you answer the questions below?

${[...cityQs, "Which application forms, checklist and objective standards apply to an SB 9 parcel map and two-unit development here?", "What fees apply, and how long does plan check usually take?"].map((q, i) => `${i + 1}. ${q}`).join("\n")}

Thank you,
[Your name]
[Organization]`;

  const steps: RoadStep[] = [
    {
      key: "confirm",
      title: "Confirm the open questions",
      todo: ["Call the listing agent and the city with the call sheet questions.", "Get answers in writing (email or letter) where you can.", "Stop here if any answer is a FAIL."],
      who: sheet.groups.length ? sheet.groups.map(([w]) => w) : ["Listing agent"],
      time: [UNKNOWN],
      knows: nn([known(r, "zoning", "Zone allows SB 9"), known(r, "lot_split", "Lot passes the size test"), known(r, "flood", "Not in a flood hazard area"), known(r, "fire", "Not in a very high fire zone"), known(r, "historic", "Not on the historic layer")]),
      open: sheet.groups.flatMap(([who, qs]) => qs.map((q) => `${who}: ${q.question}`)),
      drafts: nn<Draft>([!!sheet.email && { label: "Email to listing agent", text: sheet.email }]),
      cites: [HCD_APR_2026],
      stages: [],
    },
    {
      key: "offer",
      title: "Make an offer",
      todo: ["Send a letter of intent with an SB 9 feasibility contingency and an inspection period.", "Ask for 3 years of rental history in the seller disclosures.", "Have a real estate attorney review before signing anything."],
      who: ["Nonprofit acquisitions lead", "Buyer's real estate agent", "Real estate attorney"],
      time: [UNKNOWN],
      knows: nn([
        r.asking_price ? `Asking price ${usd(r.asking_price)} (listing, collected ${r.date_collected})` : "Asking price UNKNOWN",
        homes ? `Up to ${homes} homes if every test holds (HCD April 2026 p.2: up to two units per resulting lot)` : null,
        "Nonprofits are exempt from the 3-year owner-occupancy affidavit (HCD April 2026 p.2)",
      ]),
      open: nn([openNote(r, "tenant", "Tenant in last 3 years"), openNote(r, "rent_restricted", "Rent restriction")]),
      drafts: [{ label: "Letter of intent", text: loi }],
      cites: [HCD_APR_2026],
      stages: ["offer", "under_contract"],
    },
    {
      key: "diligence",
      title: "Due diligence",
      todo: [
        "Order a survey to confirm the split line and the rear lot's access to the street.",
        `Order a title report; check for covenants, easements and prior splits.${isOpen(find(r, "environment")) ? " Order a Phase I environmental report (the environment check is open)." : ""}`,
        "Check utilities and meet the city planning desk before the inspection period ends.",
      ],
      who: ["Surveyor or civil engineer", "Title company", "Environmental consultant", "City planning desk"],
      time: [UNKNOWN],
      knows: nn([
        split ? `Desktop split: about ${split.lot_a_sqft.toLocaleString("en-US")} and ${split.lot_b_sqft.toLocaleString("en-US")} sq ft from public parcel lines (not a survey)` : null,
        r.keep_house === "fits_a" || r.keep_house === "fits_b" ? "Existing house appears to fit on one lot (desktop sketch)" : null,
        known(r, "parking", "Likely no parking can be required: near high-quality transit (HCD April 2026 p.1)"),
      ]),
      open: nn([openNote(r, "prior_split", "Prior SB 9 split"), openNote(r, "environment", "Excluded site (hazardous waste, wetland, habitat)"), openNote(r, "fault", "Earthquake fault zone"), openNote(r, "historic", "Historic resource")]),
      drafts: [{ label: "Survey request", text: survey }, { label: "City pre-application email", text: preApp }],
      cites: [HCD_APR_2026],
      stages: [],
    },
    {
      key: "close",
      title: "Close the purchase",
      todo: ["Remove the contingency only after the survey, title and city answers check out.", "Line up acquisition funding (see Fund the gap).", "Close escrow and record the deed."],
      who: ["Escrow officer", "Lender or funder", "Real estate attorney"],
      time: [UNKNOWN],
      knows: nn([r.land_cost_per_home ? `Land and building per home: ${usd(r.land_cost_per_home)} (asking ÷ homes)` : null]),
      open: [],
      drafts: [],
      cites: [],
      stages: ["closed"],
    },
    {
      key: "apply",
      title: "Apply for the SB 9 lot split and two units",
      todo: [
        "Submit the parcel map for the urban lot split and the two-unit development together.",
        "Design to the city's objective standards only; side and rear setbacks can be no more than 4 ft.",
        "Approval is ministerial: no hearing and no CEQA review.",
      ],
      who: ["Surveyor or civil engineer", "Architect or designer", "City planning desk"],
      time: [
        { text: "30 days for the city to say whether the application is complete (Permit Streamlining Act)", cite: { ...HCD_APR_2026, label: HCD_APR_2026.label + ", p.2" } },
        { text: "60 days for a decision on a complete application", cite: { ...HCD_APR_2026, label: HCD_APR_2026.label + ", p.2" } },
      ],
      knows: nn([known(r, "zoning", "Single-family zone"), known(r, "lot_split", "Both lots meet 1,200 sq ft on paper"), homes ? `Max homes: ${homes}` : null]),
      open: [],
      drafts: [],
      cites: [{ ...HCD_APR_2026, label: HCD_APR_2026.label + ", p.2" }, { ...HCD_SEP_2024, label: HCD_SEP_2024.label + ", p.4 (4 ft setbacks), p.5 (ministerial, no CEQA)" }],
      stages: ["application_submitted", "deemed_complete", "decision"],
    },
    {
      key: "permits",
      title: "Building permits",
      todo: ["Submit construction plans for plan check.", "Answer plan-check corrections quickly; each resubmittal adds time.", "Get utility and fire sign-offs."],
      who: ["Architect or designer", "City building and safety desk", "Utility providers"],
      time: [UNKNOWN],
      knows: [],
      open: ["Plan-check time and fees: UNKNOWN; ask the city"],
      drafts: [],
      cites: [],
      stages: ["permits_issued"],
    },
    {
      key: "build",
      title: "Build",
      todo: ["Hire a licensed general contractor.", "Track draws and inspections against the schedule.", "Record each date here so FourFold learns real timelines."],
      who: ["General contractor", "City building inspector", "Construction lender"],
      time: t
        ? [{ text: `Median ${t.medianMonths} months from building permit to completion, across ${t.n} of ${t.total} OC SB 9 projects that report both dates. Only projects cities labelled SB 9; mostly Garden Grove; Santa Ana's count is UNKNOWN. A guide, not a promise.`, cite: APR }]
        : [UNKNOWN],
      knows: [],
      open: [],
      drafts: [],
      cites: [APR],
      stages: ["construction_start", "completed"],
    },
    {
      key: "sell",
      title: "Sell or rent to families",
      todo: ["Record the affordability covenant your funders require (terms come from each program: UNKNOWN here).", "Qualify buyers or renters against current income limits.", "Price so housing cost stays affordable for the income category."],
      who: ["Nonprofit homeownership or leasing staff", "Funding program administrator", "Escrow officer"],
      time: [UNKNOWN],
      knows: [],
      open: ["Covenant length and income category: UNKNOWN, set by the funding program"],
      drafts: [],
      cites: [HCD_INCOME, HSC_50052_5],
      stages: [],
    },
  ];
  return { siteId: r.id, warning, steps };
}

// ---------- progress tracker -> outcome record ----------

export type Progress = {
  steps: Record<string, { done: boolean; date?: string }>;
  stages: Partial<Record<StageKey, string>>;
  decision?: "approved" | "denied";
  org?: string;
  source?: string;
  notes?: string;
};
export const progressKey = (siteId: string) => `fourfold-progress-${siteId}`;
export const emptyProgress = (): Progress => ({ steps: {}, stages: {} });

/** Build an outcome record (src/lib/outcomes.ts) from the tracker and validate it. */
export function progressToOutcome(r: SiteResult, p: Progress, today = new Date().toISOString().slice(0, 10)): Validation {
  const stages: Partial<Record<StageKey, string>> = {};
  for (const s of STAGES) if (p.stages[s.key]) stages[s.key] = p.stages[s.key];
  const rec: OutcomeRecord = {
    schema_version: 1,
    project_id: `${r.id}-${today}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    site: { site_id: r.id, apn: r.parcel?.apn ?? "", address: r.address, city: r.city },
    org: p.org?.trim() || undefined,
    recorded_at: today,
    stages,
    decision: stages.decision ? p.decision : undefined,
    outcome: p.decision === "denied" && stages.decision ? "denied" : stages.completed ? "approved" : "in_progress",
    checks_confirmed: [],
    corrections: [],
    went_right: [],
    went_wrong: [],
    actual_costs: { purchase: null, construction: null, time: null, fees: null },
    homes_delivered: null,
    source: p.source?.trim() ?? "",
    notes: p.notes?.trim() || undefined,
  };
  if (!rec.org) delete rec.org;
  if (!rec.decision) delete rec.decision;
  if (!rec.notes) delete rec.notes;
  return validateOutcome(rec);
}
