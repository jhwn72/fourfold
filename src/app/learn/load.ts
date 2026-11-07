// Server-only loader for outcome records. Reads data/outcomes/*.json (real records) and, only when
// includeExamples is set, data/outcomes/examples/*.json (MADE UP). Read-only: never writes (Vercel's
// filesystem is read-only at runtime). Used at build time by /learn and by scripts (precompute, tests).
import { promises as fs } from "fs";
import path from "path";
import { selectRecords } from "../../lib/outcomes";

async function readDir(dir: string) {
  let names: string[] = [];
  try {
    names = (await fs.readdir(dir)).filter((n) => n.endsWith(".json")).sort();
  } catch {
    return [];
  }
  return Promise.all(
    names.map(async (n) => {
      const file = path.join(dir, n);
      try {
        return { file, value: JSON.parse(await fs.readFile(file, "utf8")) as unknown };
      } catch (e) {
        return { file, value: { parse_error: String(e) } as unknown };
      }
    })
  );
}

export async function loadOutcomes(opts: { includeExamples?: boolean; root?: string } = {}) {
  const base = path.join(opts.root ?? process.cwd(), "data", "outcomes");
  const files = await readDir(base);
  if (opts.includeExamples) files.push(...(await readDir(path.join(base, "examples"))));
  return selectRecords(files, opts);
}
