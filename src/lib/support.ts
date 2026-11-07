// Local support check: public signals about the city + the organization's own local ties.
// Pure functions only (no React, no fetch). City data: data/support/<city>.json (sources + dates inside).
//
// ASSUMPTION: the weights below are FourFold's simple, explicit judgment, not a published standard.
// They are meant to be read and argued with, not trusted as a score.
import santaAna from "../../data/support/santa-ana.json";

export type SignalStatus = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "UNKNOWN";

export interface CitySignal {
  id: string;
  label: string;
  value: string;
  status: SignalStatus;
  meaning: string;
  source: { name: string; url: string };
  lead_url?: string;
  checked: string;
}

export interface CitySignals {
  city: string;
  checked: string;
  note: string;
  signals: CitySignal[];
}

export type YNU = "yes" | "no" | "unknown";
export type OrgType = "nonprofit" | "clt" | "other" | "";
export type MeetingStatus = "held" | "planned" | "no" | "unknown";

/** What the user tells FourFold about their organization. No individuals' names or personal details. */
export interface OrgProfile {
  name: string;
  type: OrgType;
  cities: string; // comma separated: cities where the org already has projects or homes
  partners: string; // free text: local partner organizations (e.g. a congregation, a CDC)
  housingDivision: YNU;
  planning: YNU;
  councilOffice: YNU;
  communityMeeting: MeetingStatus;
  lettersOfSupport: YNU;
  localFunding: YNU;
  localFundingAmount: string; // as typed by the user; FourFold does not interpret it
  boardInCity: YNU;
  updated?: string;
}

export const EMPTY_PROFILE: OrgProfile = {
  name: "",
  type: "",
  cities: "",
  partners: "",
  housingDivision: "unknown",
  planning: "unknown",
  councilOffice: "unknown",
  communityMeeting: "unknown",
  lettersOfSupport: "unknown",
  localFunding: "unknown",
  localFundingAmount: "",
  boardInCity: "unknown",
};

export type SupportLevel = "STRONG" | "SOME" | "WEAK" | "UNKNOWN";

export interface Reason {
  text: string;
  from: "city" | "org";
  ref: string; // signal id or profile field
  effect: "+" | "-" | "0" | "?";
  points?: number;
}

export interface SupportResult {
  level: SupportLevel;
  orgPoints: number;
  orgMax: number;
  answered: number;
  reasons: Reason[];
  steps: string[];
  cityNegatives: number;
}

/** ASSUMPTION: points per org answer. Shown in the UI. */
export const WEIGHTS = {
  projectsInCity: 2,
  localPartners: 1,
  housingDivision: 2,
  planning: 1,
  councilOffice: 1,
  meetingHeld: 2,
  meetingPlanned: 1,
  lettersOfSupport: 2,
  localFunding: 2,
  boardInCity: 1,
} as const;

/** ASSUMPTION: thresholds on org points (max 14). Fewer than MIN_ANSWERED answers gives UNKNOWN. */
export const THRESHOLDS = { strong: 7, some: 3 } as const;
export const MIN_ANSWERED = 3;
export const ORG_MAX = 14;

const CITY_DATA: Record<string, CitySignals> = {
  "santa ana": santaAna as CitySignals,
};

export function getCitySignals(city: string): CitySignals | null {
  return CITY_DATA[city.trim().toLowerCase()] ?? null;
}

function listHas(list: string, city: string): boolean {
  const c = city.trim().toLowerCase();
  return list
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .some((s) => s.length > 0 && s === c);
}

const LEVEL_ORDER: SupportLevel[] = ["WEAK", "SOME", "STRONG"];

/**
 * Combine city signals and the org profile into a support level.
 * Rules (ASSUMPTION):
 * - Only the org's own ties earn points. Public data alone is not local support.
 * - STRONG at >= 7 org points, SOME at >= 3, else WEAK.
 * - Each NEGATIVE city signal lowers the level one step (not below WEAK).
 * - No profile, or fewer than 3 questions answered: UNKNOWN.
 */
export function assessSupport(city: CitySignals | null, profile: OrgProfile | null, cityName = city?.city ?? "this city"): SupportResult {
  const reasons: Reason[] = [];
  const steps: string[] = [];
  let pts = 0;
  let answered = 0;

  // City signals: listed as reasons, negatives downgrade, unknowns become steps.
  let cityNegatives = 0;
  for (const s of city?.signals ?? []) {
    const effect = s.status === "POSITIVE" ? "+" : s.status === "NEGATIVE" ? "-" : s.status === "UNKNOWN" ? "?" : "0";
    if (s.status === "NEGATIVE") cityNegatives++;
    reasons.push({ text: `${s.label}: ${s.value}`, from: "city", ref: s.id, effect });
  }
  if (!city) reasons.push({ text: `No public signals collected for ${cityName} yet.`, from: "city", ref: "none", effect: "?" });

  const p = profile;
  const add = (cond: boolean, ref: string, yesText: string, points: number) => {
    if (cond) {
      pts += points;
      reasons.push({ text: yesText, from: "org", ref, effect: "+", points });
    }
  };

  if (p) {
    // projects in city
    if (p.cities.trim()) answered++;
    const inCity = listHas(p.cities, cityName);
    add(inCity, "cities", `Your organization already has projects or homes in ${cityName}.`, WEIGHTS.projectsInCity);
    if (p.cities.trim() && !inCity) reasons.push({ text: `No existing projects listed in ${cityName}.`, from: "org", ref: "cities", effect: "0" });

    if (p.partners.trim()) answered++;
    add(p.partners.trim().length > 0, "partners", "You listed local partner organizations.", WEIGHTS.localPartners);

    const ynu: [keyof OrgProfile, string, string, number][] = [
      ["housingDivision", `You have a working relationship with the ${cityName} housing division.`, "housing division", WEIGHTS.housingDivision],
      ["planning", `You have a working relationship with ${cityName} planning.`, "planning", WEIGHTS.planning],
      ["councilOffice", "You have a relationship with the council office for this area.", "council office", WEIGHTS.councilOffice],
      ["lettersOfSupport", "You have letters of support on file.", "letters of support", WEIGHTS.lettersOfSupport],
      ["localFunding", `Local funding is committed${p.localFundingAmount.trim() ? ` (you entered: ${p.localFundingAmount.trim()})` : ""}.`, "local funding", WEIGHTS.localFunding],
      ["boardInCity", `Board members or volunteers live in ${cityName}.`, "board or volunteers in city", WEIGHTS.boardInCity],
    ];
    for (const [key, text, short, w] of ynu) {
      const v = p[key] as YNU;
      if (v !== "unknown") answered++;
      add(v === "yes", key, text, w);
      if (v === "no") reasons.push({ text: `No ${short} yet.`, from: "org", ref: key, effect: "0" });
    }

    if (p.communityMeeting !== "unknown") answered++;
    add(p.communityMeeting === "held", "communityMeeting", "You have held a community meeting in the neighborhood.", WEIGHTS.meetingHeld);
    add(p.communityMeeting === "planned", "communityMeeting", "A community meeting in the neighborhood is planned.", WEIGHTS.meetingPlanned);
  }

  // Steps, most useful first.
  if (!p || p.housingDivision !== "yes") steps.push(`Meet the ${cityName} housing division about SB 9 lot splits and affordable ownership homes.`);
  if (!p || (p.communityMeeting !== "held" && p.communityMeeting !== "planned")) steps.push("Hold a neighborhood meeting before you make an offer.");
  else if (p.communityMeeting === "planned") steps.push("Hold the planned neighborhood meeting and note what neighbors raise.");
  if (!p || p.lettersOfSupport !== "yes") steps.push("Get a letter of support from a local partner (a congregation, a community development group, a neighborhood association).");
  if (!p || p.localFunding !== "yes") steps.push("Line up local funding before the offer (a local foundation, a city program, a lender).");
  if (!p || p.planning !== "yes") steps.push(`Ask ${cityName} planning for its current SB 9 rules and any handout.`);
  for (const s of city?.signals ?? []) {
    if (s.id === "hcd_letters" && s.status === "UNKNOWN") steps.push(`Check HCD's letters dashboard for ${cityName}: ${s.source.url}`);
  }
  if (!p || p.councilOffice !== "yes") steps.push("Introduce the project to the council office for the district.");
  if (!p || p.boardInCity !== "yes") steps.push(`Recruit board members or volunteers who live in ${cityName}.`);

  let level: SupportLevel;
  if (!p || answered < MIN_ANSWERED) {
    level = "UNKNOWN";
  } else {
    let i = pts >= THRESHOLDS.strong ? 2 : pts >= THRESHOLDS.some ? 1 : 0;
    i = Math.max(0, i - cityNegatives);
    level = LEVEL_ORDER[i];
  }

  return { level, orgPoints: pts, orgMax: ORG_MAX, answered, reasons, steps, cityNegatives };
}

/** The rule John asked for: recommend a purchase only when the site passes AND support is at least SOME. */
export function isRecommended(verdict: string, level: SupportLevel): boolean {
  return verdict === "LIKELY YES" && (level === "STRONG" || level === "SOME");
}

export const LEVEL_TEXT: Record<SupportLevel, string> = {
  STRONG: "Strong local support",
  SOME: "Some local support",
  WEAK: "Weak local support",
  UNKNOWN: "Local support unknown",
};

/** Maps a level to existing globals.css status classes. */
export const LEVEL_CLASS: Record<SupportLevel, string> = {
  STRONG: "PASS",
  SOME: "POSSIBLE",
  WEAK: "FAIL",
  UNKNOWN: "UNKNOWN",
};
