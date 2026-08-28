/**
 * The two pulse invitations.
 *
 * Flitspulse: five questions, monthly. Dieptepulse: twelve questions, every
 * four months. Both mails carry the same promise — short, and something is
 * actually done with the answers — so they share one voice and one shell.
 */

import {
  brand,
  button,
  esc,
  layout,
  paragraph,
  question,
  questionList,
  sectionLabel,
} from "./layout.ts";

export type PulseMail = {
  subject: string;
  html: string;
  /** Plain-text alternative. Never ship HTML-only: it reads as spam. */
  text: string;
};

export type PulseVars = {
  /** Greeting name, e.g. "Jasper". */
  firstName: string;
  /** Absolute link to the survey — a relative URL is dead in an inbox. */
  pulseUrl: string;
  /** Closing date, already formatted in Dutch, e.g. "12 september". */
  closingDate: string;
  /** What happened with the previous round. 1-2 sentences (flits), 2-3 (diepte). */
  previousRoundUpdate: string;
  /** Sender name under "Groet,". */
  senderName: string;
  unsubscribeUrl?: string;
};

const scaleLine =
  "Je geeft antwoord op een schaal van 1 tot 5, waarbij 1 = helemaal oneens en 5 = helemaal eens. Denk daarbij aan de afgelopen 4 weken.";

function updateBlock(text: string, label: string): string {
  return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 8px;">
        <tr>
          <td style="border-left:3px solid ${brand.secondary};padding:2px 0 2px 16px;">
            <p style="margin:0 0 6px;font-family:${brand.font};font-size:15px;font-weight:600;color:${brand.ink};">${esc(label)}</p>
            <p style="margin:0;font-family:${brand.font};font-size:16px;line-height:26px;color:${brand.muted};">${esc(text)}</p>
          </td>
        </tr>
      </table>`;
}

export function flitspulseMail(vars: PulseVars): PulseMail {
  const body = `
            <h1 style="margin:0 0 18px;font-family:${brand.font};font-size:26px;line-height:34px;font-weight:700;color:${brand.ink};">Twee minuten: hoe gaat het met je deze maand?</h1>
            ${paragraph(`Hoi ${esc(vars.firstName)},`)}
            ${paragraph("Het is weer tijd voor de flitspulse. Vijf vragen, ongeveer twee minuten. Je antwoorden helpen ons zien wat er speelt — en er wordt iets mee gedaan.")}
            ${button("Start de pulse", vars.pulseUrl)}
            ${paragraph(scaleLine)}
            ${paragraph("<strong>De vragen van deze maand:</strong>")}
            ${questionList(
              [
                question(1, "Ik ga met plezier naar mijn werk."),
                question(2, "Het werk dat ik doe, doet er echt toe."),
                question(3, "Ik voelde me de afgelopen weken opgewekt en goedgehumeurd."),
                question(4, "Mijn werkdruk is vol te houden."),
              ].join(""),
            )}
            ${paragraph("En tot slot, in je eigen woorden:")}
            ${questionList(
              question(5, "Wat wil je nog delen?", "Wat ging goed, wat zit je dwars, of wat zou je anders willen?"),
            )}
            ${updateBlock(vars.previousRoundUpdate, "Wat er met de vorige ronde is gebeurd")}
            ${paragraph(`De pulse staat open tot ${esc(vars.closingDate)}.`)}
            ${paragraph(`Groet,<br>${esc(vars.senderName)}`)}`;

  const text = `Hoi ${vars.firstName},

Het is weer tijd voor de flitspulse. Vijf vragen, ongeveer twee minuten. Je antwoorden helpen ons zien wat er speelt — en er wordt iets mee gedaan.

Start de pulse: ${vars.pulseUrl}

${scaleLine}

De vragen van deze maand:

1. Ik ga met plezier naar mijn werk.
2. Het werk dat ik doe, doet er echt toe.
3. Ik voelde me de afgelopen weken opgewekt en goedgehumeurd.
4. Mijn werkdruk is vol te houden.

En tot slot, in je eigen woorden:

5. Wat wil je nog delen?
   Wat ging goed, wat zit je dwars, of wat zou je anders willen?

Wat er met de vorige ronde is gebeurd: ${vars.previousRoundUpdate}

De pulse staat open tot ${vars.closingDate}.

Groet,
${vars.senderName}

—
Namber · Hoge der A 26, 9712 AE Groningen · info@namber.nl`;

  return {
    subject: "2 minuten: hoe gaat het met je deze maand?",
    html: layout({
      preheader: "Vijf vragen, ongeveer twee minuten. En er wordt iets mee gedaan.",
      body,
      unsubscribeUrl: vars.unsubscribeUrl,
    }),
    text,
  };
}

export function dieptepulseMail(vars: PulseVars): PulseMail {
  const anonymousNote =
    "Deze antwoorden worden losgekoppeld van je naam en alleen als groepsgemiddelde getoond, nooit onder de vijf reacties.";

  const body = `
            <h1 style="margin:0 0 18px;font-family:${brand.font};font-size:26px;line-height:34px;font-weight:700;color:${brand.ink};">Dieptepulse: 12 vragen over hoe het écht gaat</h1>
            ${paragraph(`Hoi ${esc(vars.firstName)},`)}
            ${paragraph("Elke vier maanden gaan we wat verder dan de flitspulse. Twaalf vragen, ongeveer vijf minuten.")}
            ${button("Start de dieptepulse", vars.pulseUrl)}
            ${paragraph(scaleLine)}
            ${sectionLabel("Werkgeluk")}
            ${questionList(
              [
                question(1, "Ik ga met plezier naar mijn werk."),
                question(2, "Ik krijg de kans om dagelijks te doen waar ik goed in ben."),
                question(3, "Ik zou deze organisatie aanbevelen als een goede plek om te werken."),
              ].join(""),
            )}
            ${sectionLabel("Zingeving")}
            ${questionList(
              [
                question(4, "Het werk dat ik doe, doet er echt toe."),
                question(5, "Ik zie duidelijk hoe mijn werk bijdraagt aan het grotere doel van de organisatie."),
                question(6, "Ik kan me in mijn werk blijven ontwikkelen in een richting die ik zelf wil."),
              ].join(""),
            )}
            ${sectionLabel("Welzijn")}
            ${questionList(
              [
                question(7, "Ik voelde me de afgelopen weken opgewekt en goedgehumeurd."),
                question(8, "Mijn werkdruk is vol te houden."),
                question(9, "Mijn werk en privéleven zijn goed in balans."),
              ].join(""),
            )}
            ${sectionLabel("Organisatie — deze twee vragen zijn anoniem", anonymousNote)}
            ${questionList(
              [
                question(10, "Ik kan hier veilig mijn mening geven, ook als die afwijkt."),
                question(11, "Ik heb vertrouwen in de richting die de leiding met deze organisatie inslaat."),
              ].join(""),
            )}
            ${sectionLabel("Tot slot")}
            ${questionList(
              question(12, "Wat wil je nog delen?", "Wat ging goed, wat zit je dwars, of wat zou je anders willen?"),
            )}
            ${updateBlock(vars.previousRoundUpdate, "Wat er met de vorige ronde is gebeurd")}
            ${paragraph(`De dieptepulse staat open tot ${esc(vars.closingDate)}. De uitkomsten deel ik daarna met iedereen, samen met wat we ermee gaan doen.`)}
            ${paragraph(`Groet,<br>${esc(vars.senderName)}`)}`;

  const text = `Hoi ${vars.firstName},

Elke vier maanden gaan we wat verder dan de flitspulse. Twaalf vragen, ongeveer vijf minuten.

Start de dieptepulse: ${vars.pulseUrl}

${scaleLine}

WERKGELUK
1. Ik ga met plezier naar mijn werk.
2. Ik krijg de kans om dagelijks te doen waar ik goed in ben.
3. Ik zou deze organisatie aanbevelen als een goede plek om te werken.

ZINGEVING
4. Het werk dat ik doe, doet er echt toe.
5. Ik zie duidelijk hoe mijn werk bijdraagt aan het grotere doel van de organisatie.
6. Ik kan me in mijn werk blijven ontwikkelen in een richting die ik zelf wil.

WELZIJN
7. Ik voelde me de afgelopen weken opgewekt en goedgehumeurd.
8. Mijn werkdruk is vol te houden.
9. Mijn werk en privéleven zijn goed in balans.

ORGANISATIE — deze twee vragen zijn anoniem
${anonymousNote}
10. Ik kan hier veilig mijn mening geven, ook als die afwijkt.
11. Ik heb vertrouwen in de richting die de leiding met deze organisatie inslaat.

TOT SLOT
12. Wat wil je nog delen?
    Wat ging goed, wat zit je dwars, of wat zou je anders willen?

Wat er met de vorige ronde is gebeurd: ${vars.previousRoundUpdate}

De dieptepulse staat open tot ${vars.closingDate}. De uitkomsten deel ik daarna met iedereen, samen met wat we ermee gaan doen.

Groet,
${vars.senderName}

—
Namber · Hoge der A 26, 9712 AE Groningen · info@namber.nl`;

  return {
    subject: "Dieptepulse: 12 vragen over hoe het écht gaat",
    html: layout({
      preheader: "Twaalf vragen, ongeveer vijf minuten. Twee vragen zijn anoniem.",
      body,
      unsubscribeUrl: vars.unsubscribeUrl,
    }),
    text,
  };
}
