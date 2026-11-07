// A small "i" marker that shows a short caveat on hover or keyboard focus. Pure CSS, works anywhere.
const DEFAULT = "A first screen on public data, not a final answer. Each lot still needs the full check and the city's confirmation.";

export default function Hint({ tip = DEFAULT, label }: { tip?: string; label?: string }) {
  return (
    <span className="hint" tabIndex={0} role="note" aria-label={tip}>
      {label ? <span className="hint-label">{label}</span> : null}
      <span className="hint-i" aria-hidden="true">i</span>
      <span className="hint-tip" aria-hidden="true">{tip}</span>
    </span>
  );
}
