// Outcome records: what really happened on a project FourFold flagged.
// One JSON file per project in data/outcomes/*.json, added by the org (or by PR).
// Pure module (no fs) so the browser form can use the same schema and validator.
// FourFold has 0 real outcome records today. data/outcomes/examples/ holds MADE UP test data only;
// the learning code ignores it unless includeExamples is set (test script and a labelled demo toggle).
import { z } from "zod";

/** Check ids from src/lib/sb9.ts and src/lib/checks/*. */
export const CHECK_IDS = [
  "parcel", "zoning", "lot_split", "flood", "fire", "historic", "tenant", "rent_restricted",
  "prior_split", "fault", "environment", "existing_house", "parking", "landslide",
] as const;
export type CheckId = (typeof CHECK_IDS)[number];

/** Project stages in order. Dates are YYYY-MM-DD. */
export const STAGES = [
  { key: "offer", label: "Offer made" },
  { key: "under_contract", label: "Under contract" },
  { key: "closed", label: "Purchase closed" },
  { key: "application_submitted", label: "SB 9 application submitted" },
  { key: "deemed_complete", label: "Application deemed complete" },
  { key: "decision", label: "Approved or denied" },
  { key: "permits_issued", label: "Building permits issued" },
  { key: "construction_start", label: "Construction started" },
  { key: "completed", label: "Completed" },
] as const;
export type StageKey = (typeof STAGES)[number]["key"];

export const COST_LINES = [
  { key: "purchase", label: "Land and building purchase" },
  { key: "construction", label: "New construction" },
  { key: "time", label: "Time costs" },
  { key: "fees", label: "Fees, design, legal, sales" },
] as const;
export type CostLineKey = (typeof COST_LINES)[number]["key"];

export const OUTCOMES = ["approved", "denied", "withdrawn", "in_progress"] as const;
/** What FourFold showed for the check at the time. */
export const SAID = ["PASS", "FAIL", "UNKNOWN", "possible FAIL"] as const;

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD");
const text = z.string().trim().min(1);

export const CorrectionSchema = z.object({
  check_id: z.enum(CHECK_IDS),
  fourfold_said: z.enum(SAID),
  reality: text, // plain words: "there was a tenant in 2025"
  reality_status: z.enum(["PASS", "FAIL"]), // what the check should have said
  /** "site" = only this property; "city" = a rule the city applies to every similar parcel. */
  scope: z.enum(["site", "city"]),
  /** A fact anyone can check (a written city letter, a recorded document), not an opinion. */
  objective: z.boolean(),
  /** The city confirmed it in writing (letter, email, staff report, approval). Required to flip a check. */
  city_confirmed_in_writing: z.boolean(),
  /** For city-scoped rules: the override applies only when the check's value contains this text, e.g. "A1". */
  applies_when_value_contains: z.string().trim().min(1).optional(),
  /** Phrase in the listing text that turned out to mean something (tenant check). Copied from the listing. */
  listing_phrase: z.string().trim().min(1).max(160).optional(),
  /** The question that caught it, or would have. Gets promoted on future call sheets. */
  question_that_caught_it: z.string().trim().min(1).max(400).optional(),
  evidence_source: z.string().trim().min(1).optional(), // e.g. "City of Santa Ana planning email, 2027-03-02"
  date: date.optional(),
});
export type Correction = z.infer<typeof CorrectionSchema>;

const money = z.number().nonnegative().nullable();

export const OutcomeSchema = z.object({
  schema_version: z.literal(1),
  is_example: z.boolean().optional(),
  warning: z.string().optional(),
  project_id: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, digits and dashes"),
  site: z.object({
    site_id: z.string().trim().optional(), // FourFold site id, e.g. "sa-03"
    apn: z.string().trim().optional(),
    address: text,
    city: text,
  }),
  org: z.string().trim().optional(),
  recorded_at: date,
  stages: z.partialRecord(z.enum(STAGES.map((s) => s.key) as [StageKey, ...StageKey[]]), date),
  decision: z.enum(["approved", "denied"]).optional(),
  outcome: z.enum(OUTCOMES),
  /** Check ids whose FourFold answer turned out right. */
  checks_confirmed: z.array(z.enum(CHECK_IDS)),
  corrections: z.array(CorrectionSchema),
  went_right: z.array(text),
  went_wrong: z.array(z.object({ text, check_id: z.enum(CHECK_IDS).optional(), question_that_would_have_caught_it: z.string().trim().min(1).optional() })),
  actual_costs: z.object({ purchase: money, construction: money, time: money, fees: money }),
  homes_delivered: z.number().int().nonnegative().nullable(),
  source: text, // where these facts come from (the org's files, city letters, recorded documents)
  notes: z.string().optional(),
});
export type OutcomeRecord = z.infer<typeof OutcomeSchema>;

export type Validation = { ok: true; record: OutcomeRecord } | { ok: false; errors: string[] };

/** Validate one parsed JSON value. Also checks stage dates run in order. */
export function validateOutcome(value: unknown): Validation {
  const r = OutcomeSchema.safeParse(value);
  if (!r.success) {
    return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
  }
  const rec = r.data;
  const errors: string[] = [];
  let prev: { key: string; d: string } | null = null;
  for (const s of STAGES) {
    const d = rec.stages[s.key];
    if (!d) continue;
    if (prev && d < prev.d) errors.push(`stages.${s.key}: ${d} is before stages.${prev.key} (${prev.d})`);
    prev = { key: s.key, d };
  }
  if (rec.decision && !rec.stages.decision) errors.push("stages.decision: a decision needs its date");
  if (rec.outcome === "denied" && rec.decision !== "denied") errors.push("outcome denied needs decision \"denied\"");
  if (rec.is_example && !/MADE UP/.test(rec.warning ?? "")) errors.push("warning: an example must say MADE UP");
  if (errors.length) return { ok: false, errors };
  return { ok: true, record: rec };
}

/** Real records only, unless includeExamples is set. Invalid records are dropped and reported. */
export function selectRecords(values: { file: string; value: unknown }[], opts: { includeExamples?: boolean } = {}) {
  const records: OutcomeRecord[] = [];
  const rejected: { file: string; errors: string[] }[] = [];
  for (const { file, value } of values) {
    const v = validateOutcome(value);
    if (!v.ok) { rejected.push({ file, errors: v.errors }); continue; }
    if (v.record.is_example && !opts.includeExamples) continue;
    records.push(v.record);
  }
  return { records, rejected };
}

/** An empty record for the browser form. */
export function blankOutcome(): OutcomeRecord {
  return {
    schema_version: 1,
    project_id: "",
    site: { site_id: "", apn: "", address: "", city: "Santa Ana" },
    org: "",
    recorded_at: new Date().toISOString().slice(0, 10),
    stages: {},
    outcome: "in_progress",
    checks_confirmed: [],
    corrections: [],
    went_right: [],
    went_wrong: [],
    actual_costs: { purchase: null, construction: null, time: null, fees: null },
    homes_delivered: null,
    source: "",
    notes: "",
  };
}
