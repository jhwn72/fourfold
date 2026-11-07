import type { CheckResult, SiteResult } from "@/lib/types";

export const money = (n: number | null) => (n == null ? "UNKNOWN" : "$" + n.toLocaleString("en-US"));
/** Per-home cost: "n/a" when SB 9 does not apply (0 homes), UNKNOWN when the price is missing. */
export const perHomeText = (perHome: number | null, homes: number | null) => (homes === 0 ? "n/a, SB 9 does not apply" : money(perHome));

function chip(c: CheckResult): [string, string] {
  if (c.possible_fail) return ["POSSIBLE", "Possible fail"];
  if (c.affects_verdict) return [c.status, c.status === "PASS" ? "Pass" : c.status === "FAIL" ? "Fail" : "Unknown"];
  // Site notes: yes/no facts, not pass/fail.
  return [c.status === "PASS" ? "PASS" : "UNKNOWN", c.status === "PASS" ? "Yes" : c.status === "FAIL" ? "No" : "Unknown"];
}

function Rows({ checks }: { checks: CheckResult[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Test</th><th>Result</th><th>Value and next step</th><th>Source, date checked</th></tr></thead>
        <tbody>
          {checks.map((c) => {
            const [cls, word] = chip(c);
            return (
              <tr key={c.id}>
                <td style={{ minWidth: 200 }}>{c.test.replace(/ \((bonus|site risk)[^)]*\)/, "")}<div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>{c.rule}</div></td>
                <td><span className={`status ${cls}`}>{word}</span></td>
                <td style={{ minWidth: 240 }}>{c.value}<div className="muted" style={{ marginTop: 4 }}>{c.note}{c.next_step ? <> <strong style={{ color: "var(--text)", fontWeight: 500 }}>Next:</strong> {c.next_step}</> : null}</div></td>
                <td style={{ minWidth: 180 }}><a href={c.source_url} target="_blank" rel="noreferrer">{c.source_name}</a><div className="faint" style={{ fontSize: 11.5 }}>{c.checked_at.slice(0, 10)}</div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Checklist({ result, showSummary = true }: { result: SiteResult; showSummary?: boolean }) {
  const tests = result.checks.filter((c) => c.affects_verdict);
  const notes = result.checks.filter((c) => !c.affects_verdict);
  const count = (s: string) => tests.filter((c) => c.status === s && !c.possible_fail).length;
  const possible = tests.filter((c) => c.possible_fail).length;
  return (
    <div>
      {showSummary && (
        <>
          <p>
            <span className={`status verdict-${result.verdict.replace(" ", "_")}`}>{result.verdict}</span>{" "}
            {result.verdict_reason}
          </p>
          <p className="muted">Max homes: {result.max_homes ?? "UNKNOWN"} · Price: {money(result.asking_price)} · Land and building purchase per home, before construction: {perHomeText(result.land_cost_per_home, result.max_homes)}</p>
        </>
      )}
      <p className="eyebrow" style={{ margin: "4px 0 8px" }}>
        {count("PASS")} pass · {count("FAIL")} fail · {possible} possible fail · {count("UNKNOWN")} unknown
      </p>
      <Rows checks={tests} />
      {notes.length > 0 && (
        <>
          <h3 style={{ marginTop: 22 }}>Site notes <span className="faint" style={{ fontSize: 13 }}>do not change the verdict</span></h3>
          <Rows checks={notes} />
        </>
      )}
    </div>
  );
}
