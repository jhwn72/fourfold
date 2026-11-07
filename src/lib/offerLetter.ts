// Draft a letter of interest to the current owner of a proactive target. Prototype only: nothing is sent.
// No owner name or mailing address is used; the letter is addressed to "the current owner".
import type { ProactiveTarget } from "./offmarket";

export function draftOfferLetter(target: Pick<ProactiveTarget, "site_address" | "city">): string {
  const addr = `${target.site_address}, ${target.city}, CA`;
  return [
    `To the current owner of ${addr}`,
    "",
    "Hello,",
    "",
    `We are [Your organization], a nonprofit that builds homes families can afford to own. We are writing to ask whether you would ever consider selling the property at ${addr}.`,
    "",
    "If we bought it, our plan would be to use California's SB 9 to split the lot and build up to four modest homes for local working families.",
    "",
    "This is not an offer at a set price, and there is no deadline. If you are open to a conversation now or later, you can reach us at [phone] or [email]. If not, no reply is needed and we will not follow up repeatedly.",
    "",
    "Thank you for your time.",
    "",
    "[Name]",
    "[Your organization]",
    "",
    "This letter was drafted by FourFold. Nothing is sent automatically.",
  ].join("\n");
}
