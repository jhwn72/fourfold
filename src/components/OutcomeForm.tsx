"use client";
// "Record an outcome": builds a valid outcome JSON in the browser. No backend; nothing is sent.
// The draft is kept in this browser's localStorage only. The user downloads or copies the JSON and adds it
// to data/outcomes/ in the repo (or sends it to the FourFold maintainer).
import { useEffect, useMemo, useState } from "react";
import {
  blankOutcome, CHECK_IDS, COST_LINES, OUTCOMES, SAID, STAGES, validateOutcome,
  type CheckId, type Correction, type OutcomeRecord,
} from "@/lib/outcomes";
import s from "./OutcomeForm.module.css";

const KEY = "fourfold.outcome-draft.v1";

type WrongItem = OutcomeRecord["went_wrong"][number];

const blankCorrection = (): Correction => ({
  check_id: "tenant", fourfold_said: "UNKNOWN", reality: "", reality_status: "FAIL", scope: "site", objective: true, city_confirmed_in_writing: false,
});

/** Drop empty optional strings so the JSON stays clean and validates. */
function clean(r: OutcomeRecord): OutcomeRecord {
  const opt = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  return {
    ...r,
    site: { address: r.site.address, city: r.site.city, site_id: opt(r.site.site_id), apn: opt(r.site.apn) },
    org: opt(r.org),
    notes: opt(r.notes),
    stages: Object.fromEntries(Object.entries(r.stages).filter(([, v]) => v)),
    decision: r.decision || undefined,
    went_right: r.went_right.map((x) => x.trim()).filter(Boolean),
    went_wrong: r.went_wrong.filter((w) => w.text.trim()).map((w) => ({ text: w.text.trim(), check_id: w.check_id || undefined, question_that_would_have_caught_it: opt(w.question_that_would_have_caught_it) })),
    corrections: r.corrections.map((c) => ({
      ...c,
      applies_when_value_contains: opt(c.applies_when_value_contains),
      listing_phrase: opt(c.listing_phrase),
      question_that_caught_it: opt(c.question_that_caught_it),
      evidence_source: opt(c.evidence_source),
      date: opt(c.date),
    })),
  };
}

const moneyIn = (v: string): number | null => {
  const t = v.replace(/[$,\s]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export default function OutcomeForm() {
  const [r, setR] = useState<OutcomeRecord>(blankOutcome);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setR({ ...blankOutcome(), ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(r)); } catch {}
  }, [r, loaded]);

  const out = useMemo(() => clean(r), [r]);
  const v = useMemo(() => validateOutcome(out), [out]);
  const json = JSON.stringify(out, null, 2);
  const set = (patch: Partial<OutcomeRecord>) => setR((p) => ({ ...p, ...patch }));
  const setCorr = (i: number, patch: Partial<Correction>) => set({ corrections: r.corrections.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const setWrong = (i: number, patch: Partial<WrongItem>) => set({ went_wrong: r.went_wrong.map((w, j) => (j === i ? { ...w, ...patch } : w)) });
  const toggleConfirmed = (id: CheckId) =>
    set({ checks_confirmed: r.checks_confirmed.includes(id) ? r.checks_confirmed.filter((x) => x !== id) : [...r.checks_confirmed, id] });

  const download = () => {
    const blob = new Blob([json + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${out.project_id || "outcome"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(json); setMsg("Copied."); } catch { setMsg("Copy failed; select the JSON below and copy it."); }
  };
  const reset = () => { if (confirm("Clear this draft?")) { setR(blankOutcome()); setMsg(""); } };

  return (
    <div className={s.form}>
      <fieldset className={s.group}>
        <legend>Project and site</legend>
        <div className={s.grid}>
          <label>Project id<input value={r.project_id} placeholder="lowercase-with-dashes" onChange={(e) => set({ project_id: e.target.value })} /></label>
          <label>Address<input value={r.site.address} onChange={(e) => set({ site: { ...r.site, address: e.target.value } })} /></label>
          <label>City<input value={r.site.city} onChange={(e) => set({ site: { ...r.site, city: e.target.value } })} /></label>
          <label>APN (optional)<input value={r.site.apn ?? ""} onChange={(e) => set({ site: { ...r.site, apn: e.target.value } })} /></label>
          <label>FourFold site id (optional)<input value={r.site.site_id ?? ""} onChange={(e) => set({ site: { ...r.site, site_id: e.target.value } })} /></label>
          <label>Organization (optional)<input value={r.org ?? ""} onChange={(e) => set({ org: e.target.value })} /></label>
          <label>Recorded on<input type="date" value={r.recorded_at} onChange={(e) => set({ recorded_at: e.target.value })} /></label>
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>Stages (dates that happened)</legend>
        <div className={s.grid}>
          {STAGES.map((st) => (
            <label key={st.key}>{st.label}
              <input type="date" value={r.stages[st.key] ?? ""} onChange={(e) => set({ stages: { ...r.stages, [st.key]: e.target.value } })} />
            </label>
          ))}
          <label>Decision
            <select value={r.decision ?? ""} onChange={(e) => set({ decision: (e.target.value || undefined) as OutcomeRecord["decision"] })}>
              <option value="">none yet</option><option value="approved">approved</option><option value="denied">denied</option>
            </select>
          </label>
          <label>Outcome
            <select value={r.outcome} onChange={(e) => set({ outcome: e.target.value as OutcomeRecord["outcome"] })}>
              {OUTCOMES.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>Checks FourFold got right</legend>
        <div className={s.checks}>
          {CHECK_IDS.map((id) => (
            <label key={id} className={s.check}><input type="checkbox" checked={r.checks_confirmed.includes(id)} onChange={() => toggleConfirmed(id)} /> {id}</label>
          ))}
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>Corrections: FourFold said X, reality was Y</legend>
        {r.corrections.map((c, i) => (
          <div key={i} className={s.row}>
            <div className={s.grid}>
              <label>Check<select value={c.check_id} onChange={(e) => setCorr(i, { check_id: e.target.value as CheckId })}>{CHECK_IDS.map((id) => <option key={id}>{id}</option>)}</select></label>
              <label>FourFold said<select value={c.fourfold_said} onChange={(e) => setCorr(i, { fourfold_said: e.target.value as Correction["fourfold_said"] })}>{SAID.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Should have been<select value={c.reality_status} onChange={(e) => setCorr(i, { reality_status: e.target.value as "PASS" | "FAIL" })}><option>PASS</option><option>FAIL</option></select></label>
              <label>Applies to<select value={c.scope} onChange={(e) => setCorr(i, { scope: e.target.value as "site" | "city" })}><option value="site">this site only</option><option value="city">every similar site in this city</option></select></label>
              <label className={s.wide}>What really happened<input value={c.reality} placeholder="e.g. a tenant lived there in 2025" onChange={(e) => setCorr(i, { reality: e.target.value })} /></label>
              <label>Only when value contains (city rules)<input value={c.applies_when_value_contains ?? ""} placeholder="e.g. A1" onChange={(e) => setCorr(i, { applies_when_value_contains: e.target.value })} /></label>
              <label>Listing phrase (tenant)<input value={c.listing_phrase ?? ""} onChange={(e) => setCorr(i, { listing_phrase: e.target.value })} /></label>
              <label className={s.wide}>Question that caught it<input value={c.question_that_caught_it ?? ""} onChange={(e) => setCorr(i, { question_that_caught_it: e.target.value })} /></label>
              <label>Evidence source<input value={c.evidence_source ?? ""} placeholder="e.g. city planning email" onChange={(e) => setCorr(i, { evidence_source: e.target.value })} /></label>
              <label>Date<input type="date" value={c.date ?? ""} onChange={(e) => setCorr(i, { date: e.target.value })} /></label>
            </div>
            <div className={s.inline}>
              <label className={s.check}><input type="checkbox" checked={c.objective} onChange={(e) => setCorr(i, { objective: e.target.checked })} /> Objective fact (anyone can check it)</label>
              <label className={s.check}><input type="checkbox" checked={c.city_confirmed_in_writing} onChange={(e) => setCorr(i, { city_confirmed_in_writing: e.target.checked })} /> City confirmed in writing</label>
              <button type="button" onClick={() => set({ corrections: r.corrections.filter((_, j) => j !== i) })}>Remove</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set({ corrections: [...r.corrections, blankCorrection()] })}>Add a correction</button>
      </fieldset>

      <fieldset className={s.group}>
        <legend>What went right</legend>
        <textarea rows={3} value={r.went_right.join("\n")} placeholder="One per line" onChange={(e) => set({ went_right: e.target.value.split("\n") })} />
      </fieldset>

      <fieldset className={s.group}>
        <legend>What went wrong</legend>
        {r.went_wrong.map((w, i) => (
          <div key={i} className={s.row}>
            <div className={s.grid}>
              <label className={s.wide}>What happened<input value={w.text} onChange={(e) => setWrong(i, { text: e.target.value })} /></label>
              <label>Related check<select value={w.check_id ?? ""} onChange={(e) => setWrong(i, { check_id: (e.target.value || undefined) as CheckId | undefined })}><option value="">none</option>{CHECK_IDS.map((id) => <option key={id}>{id}</option>)}</select></label>
              <label className={s.wide}>Question that would have caught it<input value={w.question_that_would_have_caught_it ?? ""} onChange={(e) => setWrong(i, { question_that_would_have_caught_it: e.target.value })} /></label>
            </div>
            <button type="button" onClick={() => set({ went_wrong: r.went_wrong.filter((_, j) => j !== i) })}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => set({ went_wrong: [...r.went_wrong, { text: "" }] })}>Add an item</button>
      </fieldset>

      <fieldset className={s.group}>
        <legend>Actual costs (project totals, leave blank if unknown)</legend>
        <div className={s.grid}>
          {COST_LINES.map((l) => (
            <label key={l.key}>{l.label}
              <input inputMode="numeric" value={r.actual_costs[l.key] ?? ""} onChange={(e) => set({ actual_costs: { ...r.actual_costs, [l.key]: moneyIn(e.target.value) } })} />
            </label>
          ))}
          <label>Homes delivered
            <input inputMode="numeric" value={r.homes_delivered ?? ""} onChange={(e) => { const n = parseInt(e.target.value, 10); set({ homes_delivered: Number.isFinite(n) && n >= 0 ? n : null }); }} />
          </label>
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>Source and notes</legend>
        <label>Where these facts come from<input value={r.source} placeholder="e.g. our project files; city approval letter" onChange={(e) => set({ source: e.target.value })} /></label>
        <label>Notes<textarea rows={3} value={r.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} /></label>
        <p className="muted">No names, phone numbers, emails or incomes of tenants, buyers or residents.</p>
      </fieldset>

      <div className={s.result}>
        {v.ok ? (
          <p className={s.ok}>Valid outcome record.</p>
        ) : (
          <div className={s.errors}><strong>Not valid yet:</strong><ul>{v.errors.slice(0, 8).map((e) => <li key={e}>{e}</li>)}</ul></div>
        )}
        <div className={s.inline}>
          <button type="button" className="btn-primary" onClick={download} disabled={!v.ok}>Download JSON</button>
          <button type="button" onClick={copy} disabled={!v.ok}>Copy JSON</button>
          <button type="button" onClick={reset}>Clear draft</button>
          {msg && <span className="muted">{msg}</span>}
        </div>
        <p className="muted">
          Add it to data/outcomes/ in the repo (or send it to the FourFold maintainer); the next precompute run learns from it.
          The draft is saved in this browser only.
        </p>
        <details><summary>Preview JSON</summary><pre className={s.pre}>{json}</pre></details>
      </div>
    </div>
  );
}
