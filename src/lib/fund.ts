// Pure math for the Fund the gap panel. No numbers live here: every amount comes from the
// listing (asking price) or from what the user types. Example figures are in FundGap.tsx,
// labelled ASSUMPTION (the brief's mock worked example, docs/background.md).

export type CostLine = { key: string; label: string; amount: number | null };

export type LineCoverage = CostLine & { funded: number; uncovered: number | null };

export type GapResult = {
  totalCost: number | null; // null = UNKNOWN (a cost line is blank)
  totalFunding: number;
  gap: number | null; // cost - funding; null = UNKNOWN
  covered: boolean;
  spare: number; // > 0 only when covered
  lines: LineCoverage[];
};

/** Parse a money input. Blank or invalid -> null. Strips $ and commas. */
export function parseMoney(s: string): number | null {
  const t = s.replace(/[$,\s]/g, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Sum of cost lines, or null if any line is unknown. */
export function totalCost(lines: CostLine[]): number | null {
  let sum = 0;
  for (const l of lines) {
    if (l.amount == null) return null;
    sum += l.amount;
  }
  return sum;
}

/** Sum of funding sources; blank (null) counts as 0 because every source is optional. */
export function totalFunding(sources: (number | null)[]): number {
  return sources.reduce<number>((a, b) => a + (b ?? 0), 0);
}

/** Fill cost lines in order (land, construction, time, fees) with the funding. */
export function allocate(lines: CostLine[], funding: number): LineCoverage[] {
  let left = funding;
  return lines.map((l) => {
    if (l.amount == null) return { ...l, funded: 0, uncovered: null };
    const funded = Math.min(left, l.amount);
    left -= funded;
    return { ...l, funded, uncovered: l.amount - funded };
  });
}

export function computeGap(lines: CostLine[], sources: (number | null)[]): GapResult {
  const cost = totalCost(lines);
  const funding = totalFunding(sources);
  const gap = cost == null ? null : cost - funding;
  return {
    totalCost: cost,
    totalFunding: funding,
    gap,
    covered: gap != null && gap <= 0,
    spare: gap != null && gap < 0 ? -gap : 0,
    lines: allocate(lines, funding),
  };
}

export type DonationImpact = {
  sharePct: number; // share of the remaining gap this donation covers, 0..100
  closesGap: boolean;
  words: string; // plain-language summary of what it pays for
  gapPerHome: number | null;
  donationPerHome: number | null;
};

/** What a donation pays for, applied to the still-uncovered lines in order. */
export function donationImpact(result: GapResult, donation: number, homes: number): DonationImpact | null {
  if (result.gap == null || result.gap <= 0 || donation <= 0) return null;
  const gap = result.gap;
  const closesGap = donation >= gap;
  const sharePct = Math.min(100, (donation / gap) * 100);
  let words: string;
  if (closesGap) {
    words = donation > gap ? `closes the gap, with $${Math.round(donation - gap).toLocaleString("en-US")} to spare` : "closes the gap";
  } else {
    let left = donation;
    const full: string[] = [];
    let partial = "";
    for (const l of result.lines) {
      const u = l.uncovered ?? 0;
      if (u <= 0 || left <= 0) continue;
      if (left >= u) {
        full.push(l.label.toLowerCase());
        left -= u;
      } else {
        partial = `covers ${Math.round((left / u) * 100)}% of the remaining ${l.label.toLowerCase()} line`;
        left = 0;
      }
    }
    const parts: string[] = [];
    if (full.length) parts.push(`fully pays the remaining ${full.join(", ")} line${full.length > 1 ? "s" : ""}`);
    if (partial) parts.push(partial);
    words = parts.join(" and ");
  }
  return {
    sharePct,
    closesGap,
    words,
    gapPerHome: homes > 0 ? gap / homes : null,
    donationPerHome: homes > 0 ? donation / homes : null,
  };
}
