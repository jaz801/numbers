/**
 * The demo audience.
 *
 * Proof-of-concept only: this list is hard-coded on purpose so the demo has no
 * database to provision. It is the single source of truth for anything that
 * needs recipients — swap it for a real store when the PoC graduates.
 */

export type AudienceMember = {
  /** Stable key, also usable as a merge tag in a mail template. */
  id: string;
  name: string;
  email: string;
  /** First name, for greeting lines like "Hi Jasper,". */
  firstName: string;
  /** Optional headshot in /public/avatars. Falls back to initials. */
  avatarUrl?: string;
  /**
   * Self-declared neurodiversity or support labels.
   *
   * Special-category data under GDPR art. 9, so it only ever holds what the
   * person put here themselves. It is never inferred from answers and never
   * goes into the insights prompt — the dashboard segments on intern/extern.
   */
  labels?: string[];
};

export const audience: AudienceMember[] = [
  {
    id: "jasper",
    name: "Jasper Ruijs",
    firstName: "Jasper",
    email: "jasper.ruys@gmail.com",
    labels: ["autisme", "hoogbegaafd"],
  },
  {
    id: "kian",
    name: "Kian Horsmeier",
    firstName: "Kian",
    email: "kian@uppr.online",
  },
  {
    id: "joep",
    name: "Joep Baks",
    firstName: "Joep",
    email: "joep@uppr.online",
  },
];

/** "Jasper Ruijs" -> "JR" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** Every address in the audience, for a send-to-all action. */
export const audienceEmails: string[] = audience.map((member) => member.email);
