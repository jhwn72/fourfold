// Call sheet: turns every UNKNOWN or possible FAIL into the exact questions to ask, grouped by who to call.
// Templates are written by us from the HCD SB 9 fact sheet's tests. FourFold drafts; it never sends anything.
import type { SiteResult } from "./types";

type Who = "Listing agent" | "Santa Ana planning desk" | "Santa Ana housing division" | "Surveyor or civil engineer";
type Item = { who: Who; question: string; why: string };

const TEMPLATES: Record<string, Item[]> = {
  tenant: [{ who: "Listing agent", question: "Has anyone rented the house, or any unit on the lot, in the last 3 years? Until when?", why: "SB 9 does not apply if a tenant lived there in the last 3 years." }],
  rent_restricted: [
    { who: "Listing agent", question: "Any recorded affordability covenant or rent restriction?", why: "SB 9 excludes rent-restricted housing." },
    { who: "Santa Ana housing division", question: "Is this address under city rent control or rent stabilization, or pulled off the rental market under the Ellis Act in the last 15 years?", why: "SB 9 excludes both." },
  ],
  prior_split: [{ who: "Santa Ana planning desk", question: "Was this parcel made by an SB 9 split, or has the same owner split a lot next door under SB 9?", why: "A parcel can only be split once under SB 9." }],
  fault: [{ who: "Santa Ana planning desk", question: "Is the parcel in a state earthquake fault zone (Alquist-Priolo)?", why: "Fault zones are on SB 9's excluded site list." }],
  environment: [{ who: "Santa Ana planning desk", question: "Is the parcel on any hazardous waste list, or in a wetland, protected habitat, farmland or conservation easement area?", why: "These sites are on SB 9's excluded site list." }],
  historic: [{ who: "Santa Ana planning desk", question: "Is the house historic: a landmark, on the State Historic Resources Inventory, or a contributing building in a historic district?", why: "SB 9 excludes historic resources." }],
  zoning: [{ who: "Santa Ana planning desk", question: "Does SB 9 apply in this parcel's zone?", why: "SB 9 applies only in single-family residential zones." }],
  lot_split: [{ who: "Surveyor or civil engineer", question: "Can the lot be split into two lots of at least 1,200 sq ft, with access to the street for the rear lot?", why: "A split needs two workable lots." }],
  existing_house: [{ who: "Surveyor or civil engineer", question: "Is there a split line that keeps the existing house on one lot?", why: "Keeping the house avoids demolition and can earn rent during construction." }],
  parking: [{ who: "Santa Ana planning desk", question: "Can the city require parking here, given nearby transit?", why: "No parking may be required within 1/2 mile walking distance of high-quality transit." }],
  flood: [{ who: "Surveyor or civil engineer", question: "Can the site meet FEMA floodplain requirements?", why: "Flood zones are excluded unless a statutory exception applies." }],
};

export function buildCallSheet(r: SiteResult) {
  const items: Item[] = [];
  for (const c of r.checks) {
    const open = c.status === "UNKNOWN" || c.possible_fail || (c.id === "existing_house" && c.status === "FAIL") || (c.id === "parking" && c.status === "PASS");
    if (open && TEMPLATES[c.id]) items.push(...TEMPLATES[c.id]);
  }
  const groups = new Map<Who, Item[]>();
  for (const it of items) groups.set(it.who, [...(groups.get(it.who) ?? []), it]);

  const agentQs = groups.get("Listing agent") ?? [];
  const email = agentQs.length
    ? `Subject: Questions about ${r.address}

Hello,

Our organization is a nonprofit housing developer interested in ${r.address}${r.asking_price ? `, listed at $${r.asking_price.toLocaleString("en-US")}` : ""}. Before we consider an offer, could you help with a few questions?

${agentQs.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}

Thank you,
[Your name]
[Organization]`
    : "";
  return { groups: [...groups.entries()], email };
}
