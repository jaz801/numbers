import { audience } from "@/data/audience";
import { contextVanLabels } from "@/lib/np/context";
import type { Person } from "@/lib/db";
import { AVATARS } from "./avatars";

export type Persoon = {
  id: string;
  naam: string;
  email: string;
  /** Which segment the answer counts towards. */
  type: "intern" | "extern";
  /** Photo URL, or a data URL for one uploaded in the portal itself.
   *  Falls back to an initials circle when there is none. */
  foto: string | null;
  /** Key into CONTEXTEN — steers how the scores are read, never who sees them. */
  context: string;
};

/**
 * Intern or extern per person. Not part of the audience record itself — it is
 * a property of this pulse, not of the person.
 */
const SEGMENT_PER_LID: Record<string, "intern" | "extern"> = {
  jasper: "intern",
  joep: "intern",
  kian: "extern",
};

/**
 * The demo audience as the portal wants it. Ids stay p1/p2/p3 because the
 * example history and the seeded answers in the demo hang off them.
 */
export const DEMO_PEOPLE: Persoon[] = audience.map((member, i) => ({
  id: "p" + (i + 1),
  naam: member.name,
  email: member.email,
  type: SEGMENT_PER_LID[member.id] ?? "intern",
  foto: AVATARS[member.id] ?? member.avatarUrl ?? null,
  context: contextVanLabels(member.labels),
}));

/**
 * A row from np_people as the portal wants it.
 *
 * Someone who is also in the demo audience keeps their p1/p2/p3 id and their
 * inlined portrait: the example history and the seeded answers hang off those
 * ids, and the database has no reason to carry a 30 kB data URL twice.
 */
export function persoonVanRij(row: Person): Persoon {
  const demo = DEMO_PEOPLE.find(
    (p) => p.email.toLowerCase() === row.email.toLowerCase(),
  );
  return {
    id: demo ? demo.id : row.id,
    naam: row.name,
    email: row.email,
    type: row.member_type,
    foto: row.avatar ?? demo?.foto ?? null,
    context: contextVanLabels(row.labels),
  };
}
