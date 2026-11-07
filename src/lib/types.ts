export type Status = "PASS" | "FAIL" | "UNKNOWN";

export type CheckResult = {
  id: string;
  test: string;
  status: Status;
  value: string;
  source_url: string;
  source_name: string;
  checked_at: string; // ISO timestamp
  note: string;
  rule: string; // which SB 9 rule this test comes from, with citation
  next_step?: string; // what to do when the answer is UNKNOWN or a possible FAIL
  affects_verdict: boolean; // false for informational site-risk checks
  possible_fail?: boolean; // evidence suggests FAIL but code cannot confirm it
};

export type Parcel = {
  apn: string;
  site_address: string;
  rings: number[][][]; // State Plane CA zone VI, US feet (wkid 2230)
  area_sqft: number;
  assessor_area_sqft: number | null;
  source_url: string;
};

export type ListingFlag = {
  flag: "tenant_occupied" | "vacant" | "owner_occupied";
  present: boolean;
  quote: string | null;
};

export type ListingEvidence = {
  status: "ok" | "skipped" | "error";
  note: string;
  flags: ListingFlag[];
  model?: string;
};

export type Verdict = "LIKELY YES" | "NO" | "UNKNOWN";

export type SiteResult = {
  id: string;
  address: string;
  city: string;
  asking_price: number | null;
  listing_source_url: string;
  date_collected: string;
  parcel: Parcel | null;
  checks: CheckResult[];
  verdict: Verdict;
  verdict_reason: string;
  max_homes: number | null;
  land_cost_per_home: number | null;
  split: SplitPlan | null;
  listing_evidence: ListingEvidence;
  unknown_count: number;
  computed_at: string;
  listed_lot_sqft?: number | null;
  buildings?: number[][][]; // existing building footprints on the parcel, wkid 2230 rings
  keep_house?: KeepHouse;
  description?: string;
  description_type?: string | null;
};

export type SplitPlan = {
  line: [number, number][]; // split line endpoints, wkid 2230
  lot_a_sqft: number;
  lot_b_sqft: number;
  lot_a: number[][]; // polygon ring
  lot_b: number[][];
};

export type KeepHouse = "fits_a" | "fits_b" | "straddles" | "none" | "unknown";
