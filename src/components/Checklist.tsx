import type { SiteResult } from "@/lib/types";

export const money = (n: number | null) => (n == null ? "UNKNOWN" : "$" + n.toLocaleString("en-US"));

export default function Checklist({ result }: { result: SiteResult }) {
  return (
    <div>
      <p>
        <span className={`status verdict-${result.verdict.replace(" ", "_")}`}>{result.verdict}</span>{" "}
        {result.verdict_reason}
      </p>
      <p className="muted">Max homes: {result.max_homes ?? "UNKNOWN"} · Price: {money(result.asking_price)} · Land and building purchase per home, before construction: {money(result.land_cost_per_home)}</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Test</th><th>Result</th><th>Value</th><th>Source and date checked</th></tr></thead>
          <tbody>
            {result.checks.map((c) => (
              <tr key={c.id}>
                <td>{c.test}<div className="muted">{c.rule}</div></td>
                <td><span className={`status ${c.status}`}>{c.possible_fail ? "POSSIBLE FAIL" : c.status}</span></td>
                <td>{c.value}<div className="muted">{c.note}{c.next_step ? ` Next: ${c.next_step}` : ""}</div></td>
                <td><a href={c.source_url} target="_blank" rel="noreferrer">{c.source_name}</a><div className="muted">{c.checked_at.slice(0, 10)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
