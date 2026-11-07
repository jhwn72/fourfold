// Continual learning from real project outcomes (src/lib/outcomes.ts, data/outcomes/*.json).
// Pure and deterministic: code learns from the records; Claude only ever receives short text lessons
// (lessonsForListingReader). With 0 real records every function falls back to current behavior.
// Examples (is_example: true) are MADE UP and must only reach here through includeExamples.
import type { CheckResult, SiteResult } from "./types";
import { COST_LINES, STAGES, type CheckId, type CostLineKey, type OutcomeRecord, type StageKey } from "./outcomes";

export type Calibration = { check_id: CheckId; confirmed: number; corrected: number; total: number; corrected_pct: number };

export type RuleOverride = {
  check_id: CheckId;
  city: string;
  /** "pass": a possible FAIL becomes PASS (city confirmed in writing, objective). "note": only adds a note. */
  effect: "pass" | "note";
  value_contains: string | null;
  note: string; // "Learned from project <id>, <date>: ..."
  from_project: string;
  date: string;
  evidence_source: string | null;
};

export type StageTiming = { from: StageKey; to: StageKey; label: string; median_days: number; n: number };
export type CostLearning = { line: CostLineKey; label: string; median_per_home: number; n: number };
export type PromotedQuestion = { check_id: CheckId | null; city: string; question: string; from_project: string; why: string };

export type Learned = {
  record_count: number;
  example_count: number; // > 0 means MADE UP data is in here: label it
  project_ids: string[];
  calibration: Calibration[];
  overrides: RuleOverride[];
  timeline: StageTiming[];
  total_days: { median_days: number; n: number } | null; // first recorded stage to completed
  costs: CostLearning[]; // empty = keep the brief's ASSUMPTION examples
  questions: PromotedQuestion[];
  listing_lessons: string[];
};

const norm = (s: string) => s.trim().toLowerCase();
const oneLine = (s: string, max = 220) => s.replace(/\s+/g, " ").trim().slice(0, max);

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const a = [...xs].sort((x, y) => x - y);
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export function calibrate(records: OutcomeRecord[]): Calibration[] {
  const m = new Map<CheckId, { confirmed: number; corrected: number }>();
  const get = (id: CheckId) => m.get(id) ?? (m.set(id, { confirmed: 0, corrected: 0 }), m.get(id)!);
  for (const r of records) {
    for (const id of new Set(r.checks_confirmed)) get(id).confirmed++;
    for (const id of new Set(r.corrections.map((c) => c.check_id))) get(id).corrected++;
  }
  return [...m.entries()]
    .map(([check_id, v]) => {
      const total = v.confirmed + v.corrected;
      return { check_id, ...v, total, corrected_pct: total ? Math.round((v.corrected / total) * 100) : 0 };
    })
    .sort((a, b) => a.check_id.localeCompare(b.check_id));
}

/** City-scoped corrections become overrides. Only objective + city-confirmed-in-writing ones may flip a check to PASS. */
export function learnOverrides(records: OutcomeRecord[]): RuleOverride[] {
  const out: RuleOverride[] = [];
  for (const r of records) {
    for (const c of r.corrections) {
      if (c.scope !== "city") continue;
      const date = c.date ?? r.recorded_at;
      const effect = c.objective && c.city_confirmed_in_writing && c.reality_status === "PASS" ? "pass" : "note";
      const how = effect === "pass" ? "city confirmed in writing" : c.city_confirmed_in_writing ? "city confirmed in writing (note only)" : "not confirmed in writing by the city (note only)";
      out.push({
        check_id: c.check_id,
        city: r.site.city,
        effect,
        value_contains: c.applies_when_value_contains ?? null,
        note: `Learned from project ${r.project_id}, ${date}: ${oneLine(c.reality)} (${how}${c.evidence_source ? `; source: ${oneLine(c.evidence_source, 120)}` : ""}).`,
        from_project: r.project_id,
        date,
        evidence_source: c.evidence_source ?? null,
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.from_project.localeCompare(b.from_project));
}

export function learnTimeline(records: OutcomeRecord[]) {
  const timeline: StageTiming[] = [];
  for (let i = 0; i + 1 < STAGES.length; i++) {
    const a = STAGES[i], b = STAGES[i + 1];
    const xs = records.flatMap((r) => (r.stages[a.key] && r.stages[b.key] ? [days(r.stages[a.key]!, r.stages[b.key]!)] : [])).filter((x) => x >= 0);
    const m = median(xs);
    if (m != null) timeline.push({ from: a.key, to: b.key, label: `${a.label} to ${b.label.toLowerCase()}`, median_days: m, n: xs.length });
  }
  const totals = records.flatMap((r) => {
    const first = STAGES.map((s) => r.stages[s.key]).find(Boolean);
    return first && r.stages.completed ? [days(first, r.stages.completed)] : [];
  });
  const t = median(totals);
  return { timeline, total_days: t == null ? null : { median_days: t, n: totals.length } };
}

/** Median actual cost per delivered home, by line. Only records with homes_delivered > 0 and that line known. */
export function learnCosts(records: OutcomeRecord[]): CostLearning[] {
  const out: CostLearning[] = [];
  for (const line of COST_LINES) {
    const xs = records.flatMap((r) => {
      const amt = r.actual_costs[line.key];
      return amt != null && r.homes_delivered ? [amt / r.homes_delivered] : [];
    });
    const m = median(xs);
    if (m != null) out.push({ line: line.key, label: line.label, median_per_home: Math.round(m), n: xs.length });
  }
  return out;
}

export function learnQuestions(records: OutcomeRecord[]): PromotedQuestion[] {
  const out: PromotedQuestion[] = [];
  const seen = new Set<string>();
  const add = (q: PromotedQuestion) => {
    const k = `${norm(q.city)}|${q.check_id}|${norm(q.question)}`;
    if (!seen.has(k)) { seen.add(k); out.push(q); }
  };
  for (const r of records) {
    for (const w of r.went_wrong) {
      if (w.question_that_would_have_caught_it) add({ check_id: w.check_id ?? null, city: r.site.city, question: oneLine(w.question_that_would_have_caught_it, 400), from_project: r.project_id, why: `In project ${r.project_id}: ${oneLine(w.text)}` });
    }
    for (const c of r.corrections) {
      if (c.question_that_caught_it) add({ check_id: c.check_id, city: r.site.city, question: oneLine(c.question_that_caught_it, 400), from_project: r.project_id, why: `In project ${r.project_id}, FourFold said ${c.fourfold_said}; reality: ${oneLine(c.reality)}` });
    }
  }
  return out;
}

/** Plain-text lessons for the listing reader's system prompt. Never facts about a site; max 10, one line each. */
export function lessonsForListingReader(records: OutcomeRecord[]): string[] {
  const out: string[] = [];
  for (const r of records) {
    for (const c of r.corrections) {
      if (c.check_id !== "tenant" || !c.listing_phrase) continue;
      const phrase = oneLine(c.listing_phrase, 160).replace(/"/g, "'");
      const meaning = c.reality_status === "FAIL" ? "a tenant had lived there" : "no tenant had lived there";
      out.push(`In a past project, a listing that said "${phrase}" turned out to mean ${meaning}. Treat similar wording as a clue, and still quote only the exact text.`);
    }
  }
  return [...new Set(out)].slice(0, 10);
}

export function learn(records: OutcomeRecord[]): Learned {
  const { timeline, total_days } = learnTimeline(records);
  return {
    record_count: records.length,
    example_count: records.filter((r) => r.is_example).length,
    project_ids: records.map((r) => r.project_id),
    calibration: calibrate(records),
    overrides: learnOverrides(records),
    timeline,
    total_days,
    costs: learnCosts(records),
    questions: learnQuestions(records),
    listing_lessons: lessonsForListingReader(records),
  };
}

export const EMPTY_LEARNED: Learned = learn([]);

const sameCity = (a: string, b: string) => norm(a) === norm(b);

/** Overrides that apply to one check on one site. */
export function overridesFor(check: CheckResult, city: string, learned: Learned): RuleOverride[] {
  return learned.overrides.filter(
    (o) => o.check_id === check.id && sameCity(o.city, city) && (!o.value_contains || check.value.toLowerCase().includes(o.value_contains.toLowerCase()))
  );
}

type Decide = (checks: CheckResult[], hasParcel: boolean, price: number | null) => { verdict: SiteResult["verdict"]; reason: string; max_homes: number | null; land_cost_per_home: number | null };

/**
 * Apply learned overrides to a computed site. Adds notes; flips a check to PASS only when it is a possible FAIL
 * and a "pass" override (objective, city confirmed in writing) matches. Never touches a hard FAIL.
 * Pass sb9.ts's decide so the verdict is recomputed with the same rules. No overrides = the same result.
 */
export function applyLearned(result: SiteResult, learned: Learned, decide: Decide): SiteResult {
  if (!learned.overrides.length) return result;
  let changed = false;
  const checks = result.checks.map((c) => {
    const os = overridesFor(c, result.city, learned);
    if (!os.length) return c;
    changed = true;
    const pass = os.find((o) => o.effect === "pass");
    const notes = os.map((o) => o.note).join(" ");
    if (pass && c.possible_fail && c.status !== "FAIL") {
      return { ...c, status: "PASS" as const, possible_fail: false, next_step: undefined, note: `${c.note} ${notes}`.trim() };
    }
    return { ...c, note: `${c.note} ${notes}`.trim() };
  });
  if (!changed) return result;
  const d = decide(checks, Boolean(result.parcel), result.asking_price);
  return {
    ...result,
    checks,
    verdict: d.verdict,
    verdict_reason: d.reason,
    max_homes: d.max_homes,
    land_cost_per_home: d.land_cost_per_home,
    unknown_count: checks.filter((c) => c.status === "UNKNOWN").length,
  };
}

/** Learned call-sheet questions for a site: same city, and the check is still open on this site. Goes on top. */
export function promotedQuestionsFor(result: SiteResult, learned: Learned): PromotedQuestion[] {
  const open = new Set(result.checks.filter((c) => c.status === "UNKNOWN" || c.possible_fail).map((c) => c.id));
  return learned.questions.filter((q) => sameCity(q.city, result.city) && (q.check_id == null || open.has(q.check_id)));
}

/** Per-home cost examples from real records, or null to keep the brief's ASSUMPTION examples. */
export function learnedCostExamples(learned: Learned): Partial<Record<CostLineKey, { amount: number; n: number }>> | null {
  if (!learned.costs.length || learned.example_count > 0) return null;
  return Object.fromEntries(learned.costs.map((c) => [c.line, { amount: c.median_per_home, n: c.n }]));
}
