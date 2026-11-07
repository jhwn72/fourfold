# What's next: integration (src/components/app/FourFoldApp.tsx)

New files only: `src/lib/roadmap.ts` (pure), `src/components/next/NextSteps.tsx` (client).

1. Imports (top of FourFoldApp.tsx):

```tsx
import NextSteps, { NextStepsCompact } from "../next/NextSteps";
```

2. Window type: add `"next"`:

```tsx
type Win = null | "checklist" | "calls" | "fund" | "support" | "check" | "more" | "next";
```

3. Compact stepper in the site card, right after the `<div className={a.next} ...><NextCallCard r={site} /></div>` block and before `<div className={a.actions}>`:

```tsx
<div style={{ marginTop: 10 }}><NextStepsCompact result={site} onOpen={() => setWin("next")} /></div>
```

4. Action button, first in `<div className={a.actions}>`:

```tsx
<button type="button" onClick={() => setWin("next")}>What&apos;s next</button>
```

5. Window case, next to the other `{win === ... && site && <Window ...>}` lines:

```tsx
{win === "next" && site && <Window title={`What's next · ${site.address}`} onClose={close}><NextSteps result={site} /></Window>}
```

Deep link works through the existing `?window=` handler: `/app?site=sa-04&window=next`.

Notes
- Progress saves per site in localStorage `fourfold-progress-<siteId>` (this browser only).
- "Export outcome record" downloads JSON validated by `validateOutcome` (src/lib/outcomes.ts). The "Where these dates come from" field is required by the schema. Drop the file in `data/outcomes/`.
- Timed steps cite sources: 30-day completeness and 60-day decision (HCD SB 9 fact sheet, April 2026, p.2); build time is computed live from `data/comparables.json` (HCD APR). Every other time is UNKNOWN.
