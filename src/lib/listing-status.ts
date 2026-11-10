// Listings that left the market after they were collected on 2026-11-07. The parcel checks still hold;
// the site is kept for reference but marked so nobody treats it as available. Add an entry with its source.
export type OffMarket = { label: string; source_name: string; source_url: string; checked: string };

export const OFF_MARKET: Record<string, OffMarket> = {
  "sa-08": {
    label: "Listing removed Oct 31, 2026",
    source_name: "Redfin sale history",
    source_url: "https://www.redfin.com/CA/Santa-Ana/1217-S-Huron-Dr-92704/home/3538203",
    checked: "2026-11-10",
  },
};

export const offMarket = (id: string): OffMarket | null => OFF_MARKET[id] ?? null;
