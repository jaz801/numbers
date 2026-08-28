import { audience, type AudienceMember } from "@/data/audience";
import { segmentVan } from "@/data/segments";
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
 * The portal reads a context profile per person. Only what someone declared
 * about themselves gets mapped here; nothing is inferred from their answers.
 */
const CONTEXT_PER_LABEL: Record<string, string> = {
  autisme: "autisme",
  hoogbegaafd: "autisme",
  adhd: "adhd",
  manisch: "bipolair",
  bipolair: "bipolair",
};

function contextVan(member: AudienceMember): string {
  for (const label of member.labels ?? []) {
    const context = CONTEXT_PER_LABEL[label];
    if (context) return context;
  }
  return "geen";
}

/**
 * The demo audience as the portal wants it. Ids stay p1/p2/p3 because the
 * example history and the seeded answers in the demo hang off them.
 */
export const DEMO_PEOPLE: Persoon[] = audience.map((member, i) => ({
  id: "p" + (i + 1),
  naam: member.name,
  email: member.email,
  type: segmentVan(member.id),
  foto: AVATARS[member.id] ?? member.avatarUrl ?? null,
  context: contextVan(member),
}));
