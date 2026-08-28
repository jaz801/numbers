/**
 * Sends the pulse mails to one address, for eyeballing in a real inbox.
 *
 * Usage:
 *   MAILEROO_API_KEY=... MAILEROO_FROM="Namber <pulse@namber.nl>" \
 *     node --experimental-strip-types scripts/send-pulse-test.ts jasper.ruys@gmail.com
 *
 * Optional flags: --only=flits|diepte, --name=Jasper, --dry-run (writes the
 * rendered HTML to .preview/ instead of sending).
 *
 * The same send also runs on Vercel via POST /api/pulse/test, which is the
 * route to use when the API key lives there and not on your laptop.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { buildDemoMail, type PulseKind } from "../src/lib/emails/demo-content.ts";
import { parseAddress, sendMail } from "../src/lib/maileroo.ts";

const args = process.argv.slice(2);
const flag = (name: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const dryRun = args.includes("--dry-run");

const email = args.find((a) => !a.startsWith("--")) ?? "jasper.ruys@gmail.com";
const firstName = flag("name") ?? email.split(/[.@]/)[0].replace(/^./, (c) => c.toUpperCase());
const only = flag("only");

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://numbers-silk.vercel.app").replace(/\/$/, "");
const kinds: PulseKind[] = (only ? [only] : ["flits", "diepte"]) as PulseKind[];
const mails = kinds.map((kind) => ({ kind, mail: buildDemoMail(kind, { firstName, email }, baseUrl) }));

if (dryRun) {
  mkdirSync(".preview", { recursive: true });
  for (const { kind, mail } of mails) {
    writeFileSync(`.preview/${kind}.html`, mail.html);
    writeFileSync(`.preview/${kind}.txt`, mail.text);
    console.log(`wrote .preview/${kind}.html  (${mail.subject})`);
  }
  process.exit(0);
}

const apiKey = process.env.MAILEROO_API_KEY;
const from = process.env.MAILEROO_FROM;
if (!apiKey || !from) {
  console.error("Set MAILEROO_API_KEY and MAILEROO_FROM (e.g. \"Namber <pulse@namber.nl>\").");
  process.exit(1);
}

for (const { kind, mail } of mails) {
  const result = await sendMail(
    {
      from: parseAddress(from),
      to: [{ address: email, display_name: firstName }],
      subject: mail.subject,
      html: mail.html,
      plain: mail.text,
    },
    apiKey,
  );
  console.log(`sent ${kind} → ${email}  ${result.referenceId ?? ""}`);
}
