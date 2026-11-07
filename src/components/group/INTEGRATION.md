# Wiring the group detail view into FourFoldApp.tsx

New files: `src/lib/groupSummary.ts`, `src/components/group/GroupCard.tsx`, `GroupCard.module.css`, `GroupWindows.tsx`.
MapStage already frames the group: `focus={g ? g.ids : null}` is in place, so selecting a group moves the camera.

## 1. Imports

```tsx
import GroupCard, { type GroupWindow } from "../group/GroupCard";
import { GroupCallSheet, GroupChecklist, GroupFund } from "../group/GroupWindows";
```

## 2. Window type

```tsx
type Win = null | "checklist" | "calls" | "fund" | "support" | "check" | "more" | GroupWindow;
```

## 3. Members of the selected group (after `const g = ...`)

```tsx
const gMembers = g ? g.ids.map((id) => results.find((r) => r.id === id)).filter((r): r is SiteResult => !!r) : [];
```

## 4. Groups tab: list when nothing is selected, GroupCard when one is

Replace the `{tab === "groups" && ( ... )}` block with:

```tsx
{tab === "groups" && g && (
  <GroupCard
    group={g}
    members={gMembers}
    onBack={() => setGroup(null)}
    onSelectSite={(id) => { setSel(id); setTab("sites"); }}
    onOpen={(w) => setWin(w)}
  />
)}
{tab === "groups" && !g && (
  <>
    {/* existing title, lede, groups.map(...) cards and /clusters link, unchanged,
        except the card onClick becomes: onClick={() => setGroup(x.key)} */}
  </>
)}
```

`onSelectSite` keeps `group` set, so "← All sites" on the site card can return to Sites; switching back to the
Groups tab with the pill reopens the same group (pickTab only clears `group` when leaving Groups).
If you want the site card's back button to return to the group instead, add
`{group && <button className={a.back} onClick={() => { setSel(null); setTab("groups"); }}>← Back to {g?.label}</button>}`.

## 5. Window cases (next to the other `win === ...` blocks)

```tsx
{win === "group-checklist" && g && (
  <Window title={`SB 9 checklist · ${g.label}`} onClose={close}><GroupChecklist members={gMembers} /></Window>
)}
{win === "group-calls" && g && (
  <Window title={`Call sheet · ${g.label}`} onClose={close}><GroupCallSheet members={gMembers} /></Window>
)}
{win === "group-fund" && g && (
  <Window title={`Fund the gap · ${g.label}`} onClose={close}><GroupFund members={gMembers} /></Window>
)}
```

## 6. Optional deep link

In the `?tab=` effect: `const gq = q.get("group"); if (gq && groups.some((x) => x.key === gq)) { setTab("groups"); setGroup(gq); }`
and in the URL effect: `if (group) q.set("group", group);` (add `group` to its deps).

## Notes

- Numbers: sums and ratios of results.json fields only. Combined per home is UNKNOWN unless every price and
  home count is known. Investor / home shows only when every member is a 4-home lot (2 homes per lot without a
  split, as in InvestorCard, HCD SB 9 fact sheet p.2).
- Open questions reuse `buildCallSheet` templates, merged by check id; best next call = contact clearing the
  most (question x site) pairs, ties to the listing agent.
- GroupFund example chips are the brief's mock numbers, labelled ASSUMPTION, filled only on click.
