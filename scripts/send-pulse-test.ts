/**
 * Sends both pulse mails to one address, for eyeballing in a real inbox.
 *
 * Usage:
 *   MAILEROO_API_KEY=... MAILEROO_FROM="Namber <pulse@namber.nl>" \
 *     node --experimental-strip-types scripts/send-pulse-test.ts jasper.ruys@gmail.com
 *
 * Optional flags: --only=flits|diepte, --name=Jasper, --dry-run (writes the
 * rendered HTML to .preview/ instead of sending).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dieptepulseMail, flitspulseMail, type PulseVars } from "../src/lib/emails/pulse.ts";
import { parseAddress, sendMail } from "../src/lib/maileroo.ts";

const args = process.argv.slice(2);
const flag = (name: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const dryRun = args.includes("--dry-run");

const recipient = args.find((a) => !a.startsWith("--")) ?? "jasper.ruys@gmail.com";
const firstName = flag("name") ?? recipient.split(/[.@]/)[0].replace(/^./, (c) => c.toUpperCase());
const only = flag("only");

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://numbers-silk.vercel.app";

const vars: PulseVars = {
  firstName,
  pulseUrl: `${baseUrl}/pulse/demo-jasper`,
  closingDate: "vrijdag 11 september",
  previousRoundUpdate:
    "Uit de vorige pulse kwam naar voren dat overleggen te vaak uitlopen. Vanaf deze maand duren teamoverleggen standaard 45 minuten.",
  senderName: "Rik",
  unsubscribeUrl: `${baseUrl}/afmelden?e=${encodeURIComponent(recipient)}`,
};

const mails = [
  { key: "flits", mail: flitspulseMail(vars) },
  {
    key: "diepte",
    mail: dieptepulseMail({
      ...vars,
      pulseUrl: `${baseUrl}/dieptepulse/demo-jasper`,
      closingDate: "vrijdag 18 september",
      previousRoundUpdate:
        "De vorige dieptepulse liet zien dat de werkdruk piekt rond de kwartaalafsluiting en dat niet iedereen wist waar ze met een signaal terecht konden. We hebben de kwartaalplanning een week verruimd en er is nu één vast aanspreekpunt per team. Wat we nog niet hebben opgelost: de ruimte om te ontwikkelen — daar komen we deze ronde op terug.",
    }),
  },
].filter(({ key }) => !only || key === only);

if (dryRun) {
  mkdirSync(".preview", { recursive: true });
  for (const { key, mail } of mails) {
    writeFileSync(`.preview/${key}.html`, mail.html);
    writeFileSync(`.preview/${key}.txt`, mail.text);
    console.log(`wrote .preview/${key}.html  (${mail.subject})`);
  }
  process.exit(0);
}

const apiKey = process.env.MAILEROO_API_KEY;
const from = process.env.MAILEROO_FROM;
if (!apiKey || !from) {
  console.error("Set MAILEROO_API_KEY and MAILEROO_FROM (e.g. \"Namber <pulse@namber.nl>\").");
  process.exit(1);
}

for (const { key, mail } of mails) {
  const result = await sendMail(
    {
      from: parseAddress(from),
      to: [{ address: recipient, display_name: firstName }],
      subject: mail.subject,
      html: mail.html,
      plain: mail.text,
    },
    apiKey,
  );
  console.log(`sent ${key} → ${recipient}  ${result.referenceId ?? ""}`);
}
