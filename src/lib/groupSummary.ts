// Group summary: rolls the member SiteResults of a group into one card's worth of facts.
// Pure, no I/O, no new numbers: every figure is a sum or ratio of fields already in results.json.
// Open questions reuse buildCallSheet's templates (src/lib/callsheet.ts), merged across members by check id.
import { buildCallSheet } from "./callsheet";
import { zoneCode } from "./clusters";
import type { CheckResult, SiteResult, Verdict } from "./types";

export type GroupQuestion = {
  checkId: string;
  who: string;
  question: string;
  why: string;
  memberIds: string[]; // which members this question is open for
};

export type GroupContact = { who: string; questions: GroupQuestion[]; clears: number };

export type GroupSummary = {
  sites: number;
  homes: number; // sum of known max_homes
  homesUnknown: number; // members with no max_homes
  totalAsking: number; // sum of known asking prices (asking, not sale)
  priceUnknown: number;
  perHome: number | null; // totalAsking / homes, only when every price and home count is known
  investorHomes: number | null; // 2 per lot without a split, only when every member is a 4-home lot
  investorPerHome: number | null; // totalAsking / investorHomes, same condition plus known prices
  verdicts: Record<Verdict, number>;
  questions: GroupQuestion[]; // merged, most members first
  contacts: GroupContact[]; // grouped by who, most (question x member) pairs cleared first
  bestCall: GroupContact | null;
  zone: string | null; // shared zoning code, null when members differ or any is unknown
  cities: string[];
  reason: string;
};

/** Same rule as buildCallSheet: which checks still need a call. */
export function isOpen(c: CheckResult): boolean {
  return c.status === "UNKNOWN" || !!c.possible_fail || (c.id === "existing_house" && c.status === "FAIL") || (c.id === "parking" && c.status === "PASS");
}

// Short words for the reason line. Only check ids that appear in callsheet.ts; others fall back to the test name.
const SHORT: Record<string, string> = {
  tenant: "tenant history",
  rent_restricted: "rent rules",
  prior_split: "prior split",
  fault: "fault zone",
  environment: "environmental list",
  historic: "historic status",
  zoning: "zoning",
  lot_split: "lot split",
  existing_house: "keeping the house",
  parking: "parking",
  flood: "flood zone",
};

export function summarizeGroup(members: SiteResult[], spread: string): GroupSummary {
  const homesKnown = members.filter((m) => m.max_homes != null);
  const priceKnown = members.filter((m) => m.asking_price != null);
  const homes = homesKnown.reduce((s, m) => s + (m.max_homes ?? 0), 0);
  const totalAsking = priceKnown.reduce((s, m) => s + (m.asking_price ?? 0), 0);
  const allKnown = homesKnown.length === members.length && priceKnown.length === members.length;
  const perHome = allKnown && homes > 0 ? totalAsking / homes : null;

  // Investor comparison, as in InvestorCard: an investor who won't live there gets up to 2 homes per lot (no split).
  // Only meaningful when every member is a 4-home lot; otherwise left unknown rather than guessed.
  const allFour = members.length > 0 && members.every((m) => m.max_homes === 4);
  const investorHomes = allFour ? members.length * 2 : null;
  const investorPerHome = investorHomes && priceKnown.length === members.length ? totalAsking / investorHomes : null;

  const verdicts: Record<Verdict, number> = { "LIKELY YES": 0, UNKNOWN: 0, NO: 0 };
  for (const m of members) verdicts[m.verdict]++;

  // Merge open questions by check id + question (one check can have questions for two contacts).
  const byKey = new Map<string, GroupQuestion>();
  for (const m of members) {
    for (const c of m.checks) {
      if (!isOpen(c)) continue;
      const one = buildCallSheet({ ...m, checks: [c] });
      for (const [who, items] of one.groups) {
        for (const it of items) {
          const k = `${c.id}|${it.question}`;
          const q = byKey.get(k) ?? { checkId: c.id, who, question: it.question, why: it.why, memberIds: [] };
          if (!q.memberIds.includes(m.id)) q.memberIds.push(m.id);
          byKey.set(k, q);
        }
      }
    }
  }
  const questions = [...byKey.values()].sort((a, b) => b.memberIds.length - a.memberIds.length);

  const byWho = new Map<string, GroupQuestion[]>();
  for (const q of questions) byWho.set(q.who, [...(byWho.get(q.who) ?? []), q]);
  const contacts: GroupContact[] = [...byWho.entries()]
    .map(([who, qs]) => ({ who, questions: qs, clears: qs.reduce((s, q) => s + q.memberIds.length, 0) }))
    // Most open (question x member) pairs first; ties go to the listing agent (one call, many answers).
    .sort((a, b) => b.clears - a.clears || (a.who === "Listing agent" ? -1 : b.who === "Listing agent" ? 1 : 0));

  const zones = new Set(members.map((m) => zoneCode(m.checks.find((c) => c.id === "zoning")?.value)));
  const zone = zones.size === 1 ? [...zones][0] : null;
  const cities = [...new Set(members.map((m) => m.city))].sort();

  // Reason line, e.g. "2 sites, 8 homes within 0.24 mi; 1 needs a zoning answer".
  const homesText = homesKnown.length === members.length ? `${homes} homes` : `${homes}+ homes (${members.length - homesKnown.length} unknown)`;
  let reason = members.length > 1 ? `${members.length} sites, ${homesText} within ${spread}` : `1 site, ${homesText}`;
  const unsure = members.filter((m) => m.verdict === "UNKNOWN");
  if (unsure.length) {
    const ids = new Set<string>();
    for (const m of unsure) for (const c of m.checks) if (c.affects_verdict && isOpen(c)) ids.add(c.id);
    const words = [...ids].map((id) => SHORT[id] ?? members.flatMap((m) => m.checks).find((c) => c.id === id)?.test ?? id);
    reason += `; ${unsure.length} need${unsure.length === 1 ? "s" : ""} ${words.length === 1 ? `a ${words[0]} answer` : words.length ? `answers on ${words.slice(0, 3).join(", ")}` : "a follow-up"}`;
  }
  if (verdicts.NO) reason += `; ${verdicts.NO} ruled out`;

  return {
    sites: members.length, homes, homesUnknown: members.length - homesKnown.length,
    totalAsking, priceUnknown: members.length - priceKnown.length, perHome,
    investorHomes, investorPerHome, verdicts, questions, contacts, bestCall: contacts[0] ?? null,
    zone, cities, reason,
  };
}

/** Draft email to listing agents covering every member with agent questions. Drafts only; nothing is sent. */
export function groupAgentEmail(members: SiteResult[], s: GroupSummary): string {
  const agent = s.questions.filter((q) => q.who === "Listing agent");
  if (!agent.length) return "";
  const addr = (id: string) => members.find((m) => m.id === id)?.address ?? id;
  const sites = members.filter((m) => agent.some((q) => q.memberIds.includes(m.id)));
  const list = sites.map((m) => `- ${m.address}${m.asking_price != null ? `, listed at $${m.asking_price.toLocaleString("en-US")}` : ""}`).join("\n");
  const qs = agent.map((q, i) => `${i + 1}. ${q.question}${sites.length > 1 ? ` (${q.memberIds.map(addr).join("; ")})` : ""}`).join("\n");
  return `Subject: Questions about ${sites.length > 1 ? `${sites.length} nearby listings` : sites[0].address}

Hello,

Our organization is a nonprofit housing developer interested in ${sites.length > 1 ? "these nearby listings" : "this listing"}:
${list}

Before we consider an offer, could you help with a few questions?

${qs}

If these listings have different agents, please forward the questions for the ones you do not represent.

Thank you,
[Your name]
[Organization]`;
}
