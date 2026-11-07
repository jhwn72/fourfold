// Run every check for one address and print the result. Usage: npx tsx scripts/one.ts "4313 W 5th St"
import { checkSite } from "../src/lib/sb9";
const address = process.argv[2] ?? "4313 W 5TH ST";
checkSite({ id: "test", address, city: "Santa Ana", asking_price: null }).then((r) => {
  console.log(r.verdict, "|", r.verdict_reason, "| max homes", r.max_homes);
  for (const c of r.checks) console.log(`${c.status.padEnd(7)} ${c.test} :: ${c.value} :: ${c.note}`);
});
