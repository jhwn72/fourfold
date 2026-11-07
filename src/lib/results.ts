import data from "../../data/results.json";
import type { SiteResult } from "./types";

export type ResultsFile = { generated_at: string | null; city: string; results: SiteResult[] };
export const RESULTS = data as unknown as ResultsFile;
export const getSite = (id: string) => RESULTS.results.find((r) => r.id === id) ?? null;
