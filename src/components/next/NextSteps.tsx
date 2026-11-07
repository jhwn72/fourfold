"use client";
// "What's next" after picking a site: a compact stepper for the site card and an expanded tracker for a window.
// Progress lives in this browser only (localStorage `fourfold-progress-<siteId>`). Drafts are copied, never sent.
import { useEffect, useMemo, useState } from "react";
import { buildRoadmap, emptyProgress, progressKey, progressToOutcome, type Progress, type RoadStep } from "@/lib/roadmap";
import { STAGES, type StageKey } from "@/lib/outcomes";
import type { SiteResult } from "@/lib/types";

const stageLabel = (k: StageKey) => STAGES.find((s) => s.key === k)?.label ?? k;

function useProgress(siteId: string) {
  const [p, setP] = useState<Progress>(emptyProgress);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(progressKey(siteId));
      setP(raw ? { ...emptyProgress(), ...JSON.parse(raw) } : emptyProgress());
    } catch { setP(emptyProgress()); }
  }, [siteId]);
  const save = (next: Progress) => {
    setP(next);
    try { localStorage.setItem(progressKey(siteId), JSON.stringify(next)); } catch { /* storage blocked: keep in memory */ }
  };
  return [p, save] as const;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="chip" onClick={() => { navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }); }}>
      {ok ? "Copied" : `Copy ${label.toLowerCase()}`}
    </button>
  );
}

const dot = (on: boolean, current: boolean): React.CSSProperties => ({
  width: 18, height: 18, borderRadius: 999, flex: "0 0 18px", display: "grid", placeItems: "center", fontSize: 10, fontFamily: "var(--font-mono)",
  border: `1px solid ${current ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent)" : current ? "var(--surface-2)" : "transparent", color: on ? "var(--bg)" : "var(--text)",
});

/** Compact stepper for the site card. */
export function NextStepsCompact({ result, onOpen }: { result: SiteResult; onOpen?: () => void }) {
  const map = useMemo(() => buildRoadmap(result), [result]);
  const [p] = useProgress(result.id);
  const cur = Math.max(0, map.steps.findIndex((s) => !p.steps[s.key]?.done));
  return (
    <div className="card" style={{ padding: "12px 14px", borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="eyebrow">What&apos;s next</span>
        {onOpen && <button type="button" className="chip" onClick={onOpen}>Open tracker</button>}
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {map.steps.map((s, i) => {
          const done = !!p.steps[s.key]?.done;
          const current = i === cur && !done;
          return (
            <li key={s.key} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "3px 0", opacity: current || done ? 1 : 0.62 }}>
              <span style={dot(done, current)}>{done ? "✓" : i + 1}</span>
              <span style={{ fontSize: 13, fontWeight: current ? 600 : 400 }}>
                {s.title}
                {current && <span className="muted" style={{ display: "block", fontSize: 12, fontWeight: 400 }}>{s.todo[0]}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {map.warning && <p className="faint" style={{ fontSize: 11.5, margin: "8px 0 0" }}>{map.warning}</p>}
    </div>
  );
}

function StepCard({ s, i, current, p, save }: { s: RoadStep; i: number; current: boolean; p: Progress; save: (x: Progress) => void }) {
  const st = p.steps[s.key] ?? { done: false };
  const setStep = (patch: Partial<{ done: boolean; date: string }>) => save({ ...p, steps: { ...p.steps, [s.key]: { ...st, ...patch } } });
  const setStage = (k: StageKey, d: string) => {
    const stages = { ...p.stages };
    if (d) stages[k] = d; else delete stages[k];
    save({ ...p, stages });
  };
  const [openDraft, setOpenDraft] = useState<number | null>(null);
  return (
    <li className="card" style={{ listStyle: "none", padding: "14px 16px", borderRadius: 16, marginBottom: 10, borderColor: current ? "var(--accent)" : undefined }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={dot(st.done, current)}>{st.done ? "✓" : i + 1}</span>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 500, flex: "1 1 200px" }}>{s.title}</h3>
        <label className="muted" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <input type="checkbox" checked={st.done} onChange={(e) => setStep({ done: e.target.checked, date: e.target.checked ? st.date || new Date().toISOString().slice(0, 10) : st.date })} /> Done
        </label>
        <input type="date" aria-label={`${s.title} date`} value={st.date ?? ""} onChange={(e) => setStep({ date: e.target.value })} style={{ fontSize: 12, borderRadius: 8 }} />
      </div>
      <ul style={{ margin: "10px 0 6px", paddingLeft: 18, fontSize: 13 }}>{s.todo.map((t) => <li key={t} style={{ marginBottom: 3 }}>{t}</li>)}</ul>
      <p className="muted" style={{ margin: "4px 0", fontSize: 12 }}><b>Who:</b> {s.who.join(", ")}</p>
      <div style={{ fontSize: 12, margin: "4px 0" }}>
        <b>Time:</b>{" "}
        {s.time.map((t, k) => (
          <span key={k} style={{ display: "block" }}>
            {t.text}{t.cite && <> (<a href={t.cite.url} target="_blank" rel="noreferrer">{t.cite.label}</a>, checked {t.cite.checked})</>}
          </span>
        ))}
      </div>
      {s.knows.length > 0 && <div style={{ fontSize: 12, margin: "6px 0" }}><b>FourFold already knows:</b><ul style={{ margin: "2px 0", paddingLeft: 18 }}>{s.knows.map((k) => <li key={k}>{k}</li>)}</ul></div>}
      {s.open.length > 0 && <div style={{ fontSize: 12, margin: "6px 0" }}><b>Still open:</b><ul style={{ margin: "2px 0", paddingLeft: 18 }}>{s.open.map((k) => <li key={k}>{k}</li>)}</ul></div>}
      {s.stages.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0", fontSize: 12 }}>
          {s.stages.map((k) => (
            <label key={k} className="muted" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {stageLabel(k)}
              <input type="date" value={p.stages[k] ?? ""} onChange={(e) => setStage(k, e.target.value)} style={{ fontSize: 12, borderRadius: 8 }} />
            </label>
          ))}
          {s.stages.includes("decision") && (
            <select value={p.decision ?? ""} onChange={(e) => save({ ...p, decision: (e.target.value || undefined) as Progress["decision"] })} style={{ fontSize: 12, borderRadius: 8 }} aria-label="Decision">
              <option value="">Decision: not yet</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          )}
        </div>
      )}
      {s.drafts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {s.drafts.map((d, k) => (
            <span key={d.label} style={{ display: "contents" }}>
              <button type="button" className="chip" onClick={() => setOpenDraft(openDraft === k ? null : k)}>{openDraft === k ? "Hide" : "Show"} {d.label.toLowerCase()}</button>
              <CopyButton text={d.text} label={d.label} />
            </span>
          ))}
        </div>
      )}
      {openDraft != null && s.drafts[openDraft] && (
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginTop: 8 }}>
          {s.drafts[openDraft].text}
        </pre>
      )}
      {s.cites.length > 0 && <p className="faint" style={{ fontSize: 11, margin: "8px 0 0" }}>Sources: {s.cites.map((c, k) => <span key={k}>{k ? "; " : ""}<a href={c.url} target="_blank" rel="noreferrer">{c.label}</a> (checked {c.checked})</span>)}</p>}
    </li>
  );
}

/** Expanded stepper with tracker and outcome export, for a Window. */
export default function NextSteps({ result }: { result: SiteResult }) {
  const map = useMemo(() => buildRoadmap(result), [result]);
  const [p, save] = useProgress(result.id);
  const [errors, setErrors] = useState<string[]>([]);
  const cur = Math.max(0, map.steps.findIndex((s) => !p.steps[s.key]?.done));

  const exportRecord = () => {
    const v = progressToOutcome(result, p);
    if (!v.ok) { setErrors(v.errors); return; }
    setErrors([]);
    const blob = new Blob([JSON.stringify(v.record, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url; el.download = `${v.record.project_id}.json`; el.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>
        The steps after you pick {result.address}. Check off each step and date it. Progress is saved in this browser only. Drafts are for you to edit and send yourself; FourFold sends nothing.
      </p>
      {map.warning && <p className="card" style={{ padding: "10px 14px", borderRadius: 14, fontSize: 13 }}>{map.warning}</p>}
      <ol style={{ margin: 0, padding: 0 }}>
        {map.steps.map((s, i) => <StepCard key={s.key} s={s} i={i} current={i === cur && !p.steps[s.key]?.done} p={p} save={save} />)}
      </ol>
      <div className="card" style={{ padding: "14px 16px", borderRadius: 16 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 500 }}>Export outcome record</h3>
        <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
          Download the dated stages as an outcome record. Add it to data/outcomes/ so FourFold learns from real projects. Costs, corrections and homes delivered start empty; add them from your own files.
        </p>
        <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
          <label>Organization (optional) <input value={p.org ?? ""} onChange={(e) => save({ ...p, org: e.target.value })} style={{ width: "100%", borderRadius: 8 }} /></label>
          <label>Where these dates come from (required) <input value={p.source ?? ""} placeholder="e.g. our escrow file and the city's approval letter" onChange={(e) => save({ ...p, source: e.target.value })} style={{ width: "100%", borderRadius: 8 }} /></label>
          <label>Notes (optional) <input value={p.notes ?? ""} onChange={(e) => save({ ...p, notes: e.target.value })} style={{ width: "100%", borderRadius: 8 }} /></label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={exportRecord} style={{ borderRadius: 999, padding: "6px 14px", fontSize: 12 }}>Export outcome record</button>
          <button type="button" className="chip" onClick={() => { if (confirm("Clear this site's progress in this browser?")) save(emptyProgress()); }}>Reset progress</button>
        </div>
        {errors.length > 0 && <ul style={{ color: "var(--fail, #c33)", fontSize: 12, margin: "8px 0 0", paddingLeft: 18 }}>{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      </div>
      <p className="faint" style={{ fontSize: 11, marginTop: 10 }}>Prototype. Not legal or financial advice. Confirm with the city, a real estate attorney and other professionals.</p>
    </div>
  );
}
