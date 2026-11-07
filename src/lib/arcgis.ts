// Small ArcGIS REST helper. Every call has a timeout, and results can be cached on disk
// (.cache/, gitignored) so reruns of precompute do not hit government servers again.
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const TIMEOUT_MS = 8000;

// The disk cache is only used by local scripts. On Vercel the filesystem is read-only.
const CACHE_DIR = path.join(process.cwd(), ".cache");
const useCache = process.env.FOURFOLD_CACHE === "1";

export class FetchError extends Error {}

async function readCache(key: string): Promise<unknown | undefined> {
  if (!useCache) return undefined;
  try {
    return JSON.parse(await fs.readFile(path.join(CACHE_DIR, key + ".json"), "utf8"));
  } catch {
    return undefined;
  }
}

async function writeCache(key: string, value: unknown) {
  if (!useCache) return;
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(path.join(CACHE_DIR, key + ".json"), JSON.stringify(value));
}

/** POST a query to an ArcGIS layer's /query endpoint. Throws FetchError on timeout or error. */
export async function arcgisQuery(
  layerUrl: string,
  params: Record<string, string | number | boolean>,
  opts: { timeoutMs?: number; retries?: number } = {}
): Promise<{ features: ArcFeature[]; [k: string]: unknown }> {
  const body = new URLSearchParams({ f: "json" });
  for (const [k, v] of Object.entries(params)) body.set(k, String(v));
  const key = createHash("sha1").update(layerUrl + "?" + body.toString()).digest("hex");
  const cached = await readCache(key);
  if (cached) return cached as { features: ArcFeature[] };

  const retries = opts.retries ?? 0;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(layerUrl.replace(/\/$/, "") + "/query", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS),
      });
      if (!res.ok) throw new FetchError(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new FetchError(`ArcGIS error: ${json.error.message ?? JSON.stringify(json.error)}`);
      if (!Array.isArray(json.features)) json.features = [];
      await writeCache(key, json);
      return json;
    } catch (e) {
      lastErr = e;
    }
  }
  const msg =
    lastErr instanceof Error && (lastErr.name === "TimeoutError" || lastErr.name === "AbortError")
      ? `timed out after ${(opts.timeoutMs ?? TIMEOUT_MS) / 1000}s`
      : lastErr instanceof Error
        ? lastErr.message
        : String(lastErr);
  throw new FetchError(msg);
}

export type ArcFeature = {
  attributes: Record<string, unknown>;
  geometry?: { rings?: number[][][]; x?: number; y?: number };
};
