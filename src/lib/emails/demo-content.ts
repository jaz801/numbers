/**
 * The copy used for demo and test sends.
 *
 * Shared by the CLI script and the /api/pulse/test route so both put the same
 * mail in the inbox. Real rounds will get their dates, their link and their
 * "wat er met de vorige ronde is gebeurd" from the database — this file is the
 * stand-in until then.
 *
 * The questions are the one thing that may not be faked: a test send has no
 * invite behind it, so it draws its set with the *same* `drawQuestions` the
 * round uses, seeded on the recipient so the same person always gets the same
 * demo set. That way the preview shows what a real invitation will look like,
 * including the fact that two people get different questions.
 */

import { VRAGEN } from "../../components/welzijn/data.ts";
import { drawQuestions, type PoolQuestion } from "../pulse/questions.ts";
import { dieptepulseMail, flitspulseMail, type MailQuestion, type PulseMail } from "./pulse.ts";

export type PulseKind = "flits" | "diepte";

export type DemoRecipient = {
  /** Stable id from the demo audience; falls back to the address as seed. */
  id?: string;
  firstName: string;
  email: string;
};

/** The seeded question pool, in the shape `drawQuestions` expects. */
const demoPool: PoolQuestion[] = VRAGEN.map((vraag) => ({
  id: vraag.id,
  code: vraag.id,
  theme: vraag.t,
  text: vraag.tekst,
}));

/**
 * A representative draw for a test send.
 *
 * A real invite seeds on its token; there is no token here, so the recipient's
 * id is the seed: stable across sends, different per person.
 */
export function demoQuestions(kind: PulseKind, recipient: DemoRecipient): MailQuestion[] {
  return drawQuestions(demoPool, kind, recipient.id ?? recipient.email).map((question) => ({
    code: question.code,
    theme: question.theme,
    text: question.text,
  }));
}

export function buildDemoMail(
  kind: PulseKind,
  recipient: DemoRecipient,
  baseUrl: string,
): PulseMail {
  const shared = {
    firstName: recipient.firstName,
    senderName: "Rik",
    questions: demoQuestions(kind, recipient),
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
