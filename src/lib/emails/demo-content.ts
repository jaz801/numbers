/**
 * The copy used for demo and test sends.
 *
 * Shared by the CLI script and the /api/pulse/test route so both put the same
 * mail in the inbox. Real rounds will get their dates and their "wat er met de
 * vorige ronde is gebeurd" from the database — this file is the stand-in until
 * then.
 */

import { dieptepulseMail, flitspulseMail, type PulseMail } from "./pulse.ts";

export type PulseKind = "flits" | "diepte";

export type DemoRecipient = { firstName: string; email: string };

export function buildDemoMail(
  kind: PulseKind,
  recipient: DemoRecipient,
  baseUrl: string,
): PulseMail {
  const shared = {
    firstName: recipient.firstName,
    senderName: "Rik",
    unsubscribeUrl: `${baseUrl}/afmelden?e=${encodeURIComponent(recipient.email)}`,
  };

  if (kind === "flits") {
    return flitspulseMail({
      ...shared,
      pulseUrl: `${baseUrl}/pulse/demo`,
      closingDate: "vrijdag 11 september",
      previousRoundUpdate:
        "Uit de vorige pulse kwam naar voren dat overleggen te vaak uitlopen. Vanaf deze maand duren teamoverleggen standaard 45 minuten.",
    });
  }

  return dieptepulseMail({
    ...shared,
    pulseUrl: `${baseUrl}/dieptepulse/demo`,
    closingDate: "vrijdag 18 september",
    previousRoundUpdate:
      "De vorige dieptepulse liet zien dat de werkdruk piekt rond de kwartaalafsluiting en dat niet iedereen wist waar ze met een signaal terecht konden. We hebben de kwartaalplanning een week verruimd en er is nu één vast aanspreekpunt per team. Wat we nog niet hebben opgelost: de ruimte om te ontwikkelen — daar komen we deze ronde op terug.",
  });
}
