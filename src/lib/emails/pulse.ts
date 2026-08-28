/**
 * The two pulse invitations.
 *
 * Flitspulse: five questions, monthly. Dieptepulse: twelve questions, every
 * four months. Both mails carry the same promise — short, and something is
 * actually done with the answers — so they share one voice and one shell.
 *
 * The questions are **not** written here. Every invite freezes its own
 * randomised draw in `np_invites.question_ids`, so the mail has to render the
 * questions of the person it is addressed to: reading one set in the inbox and
 * answering another primes the answer and corrupts the instrument. The
 * builders stay pure functions over their input — the caller loads the frozen
 * set, these functions only lay it out.
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

/** One scored question as it was frozen on the invite. */
export type MailQuestion = {
  /** Item code, e.g. "WD03". Not shown; it keeps the shape of the invite. */
  code: string;
  /** Theme code, e.g. "WD". Used to say how wide the set reaches, not shown. */
  theme: string;
  text: string;
};

export type PulseVars = {
  /** Greeting name, e.g. "Jasper". */
  firstName: string;
  /** Absolute link to this person's own form — a relative URL is dead in an inbox. */
  pulseUrl: string;
  /**
   * The scored questions frozen on this invite, in the order they will be
   * asked. The open closing question is added by the template — it is the same
   * for everyone and is not part of the draw.
   */
  questions: MailQuestion[];
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

/** The one open question every instrument closes with. */
const openQuestion = {
  text: "Wat wil je nog delen?",
  hint: "Wat ging goed, wat zit je dwars, of wat zou je anders willen?",
} as const;

const numerals = [
  "nul", "één", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen",
  "tien", "elf", "twaalf", "dertien", "veertien", "vijftien", "zestien",
  "zeventien", "achttien", "negentien", "twintig",
];

/** "vijf", "twaalf" — falls back to the digits rather than inventing a word. */
function numeral(value: number): string {
  return numerals[value] ?? String(value);
}

function capitalise(word: string): string {
  return word.replace(/^./, (c) => c.toUpperCase());
}

/**
 * How many questions this mail actually shows: the frozen scored set plus the
 * open question. Every count in the copy is derived from this, so the mail can
 * never promise a different number than it lists.
 */
function totalCount(vars: PulseVars): number {
  return vars.questions.length + 1;
}

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

/** The frozen set as numbered rows, in the order the form will ask them. */
function scoredRows(questions: MailQuestion[]): string {
  return questionList(questions.map((item, index) => question(index + 1, item.text)).join(""));
}

function scoredLines(questions: MailQuestion[]): string {
  return questions.map((item, index) => `${index + 1}. ${item.text}`).join("\n");
}

function openRow(total: number): string {
  return questionList(question(total, openQuestion.text, openQuestion.hint));
}

function openLines(total: number, indent: string): string {
  return `${total}. ${openQuestion.text}\n${indent}${openQuestion.hint}`;
}

export function flitspulseMail(vars: PulseVars): PulseMail {
  const total = totalCount(vars);
  const countLine = `${capitalise(numeral(total))} vragen, ongeveer twee minuten.`;

  const body = `
            <h1 style="margin:0 0 18px;font-family:${brand.font};font-size:26px;line-height:34px;font-weight:700;color:${brand.ink};">Twee minuten: hoe gaat het met je deze maand?</h1>
            ${paragraph(`Hoi ${esc(vars.firstName)},`)}
            ${paragraph(`Het is weer tijd voor de flitspulse. ${esc(countLine)} Je antwoorden helpen ons zien wat er speelt — en er wordt iets mee gedaan.`)}
            ${button("Start de pulse", vars.pulseUrl)}
            ${paragraph(scaleLine)}
            ${paragraph("<strong>Jouw vragen van deze maand:</strong>")}
            ${scoredRows(vars.questions)}
            ${paragraph("En tot slot, in je eigen woorden:")}
            ${openRow(total)}
            ${updateBlock(vars.previousRoundUpdate, "Wat er met de vorige ronde is gebeurd")}
            ${paragraph(`De pulse staat open tot ${esc(vars.closingDate)}.`)}
            ${paragraph(`Groet,<br>${esc(vars.senderName)}`)}`;

  const text = `Hoi ${vars.firstName},

Het is weer tijd voor de flitspulse. ${countLine} Je antwoorden helpen ons zien wat er speelt — en er wordt iets mee gedaan.

Start de pulse: ${vars.pulseUrl}

${scaleLine}

Jouw vragen van deze maand:

${scoredLines(vars.questions)}

En tot slot, in je eigen woorden:

${openLines(total, "   ")}

Wat er met de vorige ronde is gebeurd: ${vars.previousRoundUpdate}

De pulse staat open tot ${vars.closingDate}.

Groet,
${vars.senderName}

—
Namber · Hoge der A 26, 9712 AE Groningen · info@namber.nl`;

  return {
    subject: "2 minuten: hoe gaat het met je deze maand?",
    html: layout({
      preheader: `${countLine} En er wordt iets mee gedaan.`,
      body,
      unsubscribeUrl: vars.unsubscribeUrl,
    }),
    text,
  };
}

export function dieptepulseMail(vars: PulseVars): PulseMail {
  const total = totalCount(vars);
  const themes = new Set(vars.questions.map((item) => item.theme)).size;
  const countLine = `${capitalise(numeral(total))} vragen, ongeveer vijf minuten.`;
  const drawLine =
    themes > 1
      ? `Deze vragen zijn voor jou samengesteld en raken alle ${numeral(themes)} de thema's; twee collega's krijgen dus niet dezelfde lijst.`
      : "Deze vragen zijn voor jou samengesteld; twee collega's krijgen dus niet dezelfde lijst.";
  const anonymousNote =
    "Je antwoorden worden losgekoppeld van je naam en alleen als groepsgemiddelde getoond, nooit onder de vijf reacties.";
  const heading = `Dieptepulse: ${total} vragen over hoe het écht gaat`;

  const body = `
            <h1 style="margin:0 0 18px;font-family:${brand.font};font-size:26px;line-height:34px;font-weight:700;color:${brand.ink};">${esc(heading)}</h1>
            ${paragraph(`Hoi ${esc(vars.firstName)},`)}
            ${paragraph(`Elke vier maanden gaan we wat verder dan de flitspulse. ${esc(countLine)}`)}
            ${button("Start de dieptepulse", vars.pulseUrl)}
            ${paragraph(scaleLine)}
            ${sectionLabel("Jouw vragen", `${drawLine} ${anonymousNote}`)}
            ${scoredRows(vars.questions)}
            ${sectionLabel("Tot slot")}
            ${openRow(total)}
            ${updateBlock(vars.previousRoundUpdate, "Wat er met de vorige ronde is gebeurd")}
            ${paragraph(`De dieptepulse staat open tot ${esc(vars.closingDate)}. De uitkomsten deel ik daarna met iedereen, samen met wat we ermee gaan doen.`)}
            ${paragraph(`Groet,<br>${esc(vars.senderName)}`)}`;

  const text = `Hoi ${vars.firstName},

Elke vier maanden gaan we wat verder dan de flitspulse. ${countLine}

Start de dieptepulse: ${vars.pulseUrl}

${scaleLine}

JOUW VRAGEN
${drawLine} ${anonymousNote}

${scoredLines(vars.questions)}

TOT SLOT
${openLines(total, "    ")}

Wat er met de vorige ronde is gebeurd: ${vars.previousRoundUpdate}

De dieptepulse staat open tot ${vars.closingDate}. De uitkomsten deel ik daarna met iedereen, samen met wat we ermee gaan doen.

Groet,
${vars.senderName}

—
Namber · Hoge der A 26, 9712 AE Groningen · info@namber.nl`;

  return {
    subject: heading,
    html: layout({
      preheader: `${countLine} Je antwoorden blijven anoniem.`,
      body,
      unsubscribeUrl: vars.unsubscribeUrl,
    }),
    text,
  };
}
