"use client";
// Shows what FourFold has learned. Real records by default; a labelled toggle shows the MADE UP example.
import { useState } from "react";
import type { Learned } from "@/lib/learning";
import s from "./learn.module.css";

type Props = {
  real: Learned;
  example: Learned;
  rejected: { file: string; errors: string[] }[];
  apr: { medianMonths: number; n: number; source: { name: string; url: string; checked: string } } | null;
};

const usd = (n: number) => "$" + n.toLocaleString("en-US");

export default function LearnPanels({ real, example, rejected, apr }: Props) {
  const [demo, setDemo] = useState(false);
  const L = demo ? example : real;
  const none = L.record_count === 0;

  return (
    <>
      <div className={s.status}>
        {real.record_count === 0 ? (
          <p className={s.zero}>0 real project outcomes recorded. FourFold is using public data and the brief&apos;s assumptions only.</p>
        ) : (
          <p className={s.zero}>{real.record_count} real project outcome{real.record_count === 1 ? "" : "s"} recorded: {real.project_ids.join(", ")}.</p>
        )}
        <label className={s.toggle}>
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
          Show what learning looks like with a made-up example
        </label>
      </div>

      {rejected.length > 0 && (
        <div className={`card ${s.warn}`}>
          {rejected.length} record file(s) failed validation and are ignored:
          <ul>{rejected.map((r) => <li key={r.file}><code>{r.file}</code>: {r.errors.slice(0, 3).join("; ")}</li>)}</ul>
        </div>
      )}

      {demo && (
        <div className={s.banner} role="alert">
          MADE UP EXAMPLE. Not a real project. Every number and finding below comes from
          data/outcomes/examples/example-made-up.json and is for showing how learning works.
        </div>
      )}

      <div className={demo ? s.demoWrap : undefined}>
        <section className={s.section}>
          <h2>Check calibration</h2>
          <p className="muted">How often each check&apos;s answer was later confirmed or corrected in a real project.</p>
          {L.calibration.length === 0 ? (
            <p className={s.empty}>No outcomes yet, so no calibration. Every check shows what public data says, nothing more.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Check</th><th className={s.right}>Confirmed</th><th className={s.right}>Corrected</th><th className={s.right}>Corrected %</th></tr></thead>
                <tbody>
                  {L.calibration.map((c) => (
                    <tr key={c.check_id}><td className="mono">{c.check_id}</td><td className={s.right}>{c.confirmed}</td><td className={s.right}>{c.corrected}</td><td className={s.right}>{c.corrected_pct}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={s.section}>
          <h2>Rules learned from cities</h2>
          {L.overrides.length === 0 ? (
            <p className={s.empty}>None yet. A check changes only when a city confirms something in writing on a real project.</p>
          ) : (
            <ul className={s.list}>
              {L.overrides.map((o, i) => (
                <li key={i}>
                  <span className={`status ${o.effect === "pass" ? "PASS" : "UNKNOWN"}`}>{o.effect === "pass" ? "possible FAIL to PASS" : "note only"}</span>{" "}
                  <span className="mono">{o.check_id}</span> in {o.city}{o.value_contains ? ` when the value contains "${o.value_contains}"` : ""}. {o.note}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={s.section}>
          <h2>Timelines</h2>
          <div className={`stats ${s.strip}`}>
            <div>
              <div className="k">OC SB 9, permit to completion</div>
              {apr ? <><div className="v">{apr.medianMonths} mo</div><div className={s.sub}>median, n = {apr.n}, HCD APR</div></> : <div className="v">UNKNOWN</div>}
            </div>
            <div>
              <div className="k">{demo ? "Example" : "Real outcomes"}, first stage to completed</div>
              {L.total_days ? <><div className="v">{L.total_days.median_days} days</div><div className={s.sub}>median, n = {L.total_days.n}</div></> : <><div className="v">UNKNOWN</div><div className={s.sub}>{none ? "no outcomes yet" : "none completed yet"}</div></>}
            </div>
          </div>
          {L.timeline.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Stage</th><th className={s.right}>Median days</th><th className={s.right}>Projects</th></tr></thead>
                <tbody>{L.timeline.map((t) => <tr key={t.from}><td>{t.label}</td><td className={s.right}>{t.median_days}</td><td className={s.right}>{t.n}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {apr && (
            <p className={s.source}>
              Comparables: <a href={apr.source.url} target="_blank" rel="noreferrer">{apr.source.name}</a>, checked {apr.source.checked}. Orange County
              projects labeled SB 9 that report both a building permit date and a completion date. See <a href="/comparables">SB 9 projects</a>.
            </p>
          )}
        </section>

        <section className={s.section}>
          <h2>Costs per home</h2>
          {L.costs.length === 0 ? (
            <p className={s.empty}>No real costs yet. The fund calculator keeps the brief&apos;s ASSUMPTION examples.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Line</th><th className={s.right}>Median actual per home</th><th className={s.right}>Projects</th></tr></thead>
                <tbody>{L.costs.map((c) => <tr key={c.line}><td>{c.label}</td><td className={s.right}>{usd(c.median_per_home)}</td><td className={s.right}>{c.n}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {demo && <p className={s.source}>Made-up costs never replace the fund calculator&apos;s examples.</p>}
        </section>

        <section className={s.section}>
          <h2>Questions that caught problems</h2>
          {L.questions.length === 0 ? (
            <p className={s.empty}>None yet. When a question catches a problem on a real project, it moves to the top of the call sheet for similar sites.</p>
          ) : (
            <ul className={s.list}>{L.questions.map((q, i) => <li key={i}><strong>{q.question}</strong><br /><span className="muted">{q.city}{q.check_id ? `, ${q.check_id}` : ""}. {q.why}</span></li>)}</ul>
          )}
        </section>

        <section className={s.section}>
          <h2>Lessons for the listing reader</h2>
          {L.listing_lessons.length === 0 ? (
            <p className={s.empty}>None yet. The listing reader uses its standard instructions only.</p>
          ) : (
            <ul className={s.list}>{L.listing_lessons.map((l, i) => <li key={i}>{l}</li>)}</ul>
          )}
        </section>
      </div>
    </>
  );
}
