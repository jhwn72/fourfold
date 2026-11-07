"use client";
import Link from "next/link";
import { assessSupport, getCitySignals, LEVEL_CLASS, LEVEL_TEXT, THRESHOLDS, ORG_MAX, type SignalStatus } from "@/lib/support";
import { useOrgProfile } from "./OrgProfile";
import s from "./SupportPanel.module.css";
import { Star, AssumeNote } from "@/components/Assume";

const STATUS_CLASS: Record<SignalStatus, string> = { POSITIVE: "PASS", NEUTRAL: "POSSIBLE", NEGATIVE: "FAIL", UNKNOWN: "UNKNOWN" };

export default function SupportPanel({ city }: { city: string }) {
  const { profile, loaded } = useOrgProfile();
  const signals = getCitySignals(city);
  const result = assessSupport(signals, profile, signals?.city ?? city);
  const orgReasons = result.reasons.filter((r) => r.from === "org");

  return (
    <section className={`card ${s.panel}`} aria-label={`Local support in ${city}`}>
      <div className={s.head}>
        <div>
          <div className="eyebrow">Local support · {city}</div>
          <h3 className={s.title}>Does your organization have local support here?</h3>
        </div>
        <span className={`status ${LEVEL_CLASS[result.level]}`}>{loaded ? LEVEL_TEXT[result.level] : "Loading"}</span>
      </div>

      <h4 className={s.sub}>Your organization&apos;s local ties</h4>
      {loaded && !profile ? (
        <p className={s.prompt}>
          <Link href="/org" className="btn-primary">Tell FourFold about your organization →</Link>
          <span className="muted"> Only you know your local ties. Until you add them, support is UNKNOWN and FourFold will not recommend an offer.</span>
        </p>
      ) : (
        <>
          {orgReasons.length > 0 ? (
            <ul className={s.list}>
              {orgReasons.map((r, i) => (
                <li key={i}>
                  <span className={s.effect}>{r.effect === "+" ? `+${r.points}` : "0"}</span> {r.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No answers yet.</p>
          )}
          <p className="muted">
            {result.orgPoints} of {ORG_MAX} points from {result.answered} answered questions. <Link href="/org">Edit your profile</Link>
          </p>
        </>
      )}

      <h4 className={s.sub}>Before you make an offer</h4>
      <ol className={s.list}>
        {result.steps.slice(0, 5).map((t, i) => <li key={i}>{t}</li>)}
      </ol>

      <h4 className={s.sub}>Public signals about the city</h4>
      {signals ? (
        <ul className={s.signals}>
          {signals.signals.map((sig) => (
            <li key={sig.id} className={s.signal}>
              <div className={s.sigHead}>
                <strong>{sig.label}</strong>
                <span className={`status ${STATUS_CLASS[sig.status]}`}>{sig.status}</span>
              </div>
              <div>{sig.value}</div>
              <div className="muted">{sig.meaning}</div>
              <div className="faint" style={{ fontSize: 12 }}>
                Source: <a href={sig.source.url} target="_blank" rel="noreferrer">{sig.source.name}</a> · checked {sig.checked}
                {sig.lead_url && <> · <a href={sig.lead_url} target="_blank" rel="noreferrer">unconfirmed lead</a></>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">UNKNOWN: FourFold has not collected public signals for {city} yet.</p>
      )}

      <p className={`faint ${s.foot}`}>
        How the level is set<Star />: only your organization&apos;s own ties earn points (projects in the city 2, housing division 2, letters of support 2, local funding 2, meeting held 2 or planned 1, planning 1, council office 1, local partners 1, board or volunteers in the city 1). Strong at {THRESHOLDS.strong}+, some at {THRESHOLDS.some}+, else weak; each negative public signal lowers it one step. Public data alone is not local support. FourFold recommends an offer only when the site is LIKELY YES and support is at least some. Prototype, not legal or financial advice.
      </p>
    </section>
  );
}
