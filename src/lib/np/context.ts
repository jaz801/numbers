/**
 * Translation between the self-declared labels in the database and the single
 * context profile the portal reads the scores with.
 *
 * Special-category data under GDPR art. 9: it only ever holds what someone
 * declared about themselves, and it steers how a score is read — never who
 * gets to see it.
 */

/** Label as stored -> context key in CONTEXTEN. */
const CONTEXT_PER_LABEL: Record<string, string> = {
  autisme: "autisme",
  hoogbegaafd: "autisme",
  adhd: "adhd",
  manisch: "bipolair",
  bipolair: "bipolair",
};

/** Context key -> the labels written back for someone who picks it. */
const LABELS_PER_CONTEXT: Record<string, string[]> = {
  geen: [],
  adhd: ["adhd"],
  autisme: ["autisme"],
  bipolair: ["bipolair"],
};

export function contextVanLabels(labels: readonly string[] | null | undefined): string {
  for (const label of labels ?? []) {
    const context = CONTEXT_PER_LABEL[label];
    if (context) return context;
  }
  return "geen";
}

export function labelsVoorContext(context: string): string[] {
  return LABELS_PER_CONTEXT[context] ?? [];
}

export function isContext(context: string): boolean {
  return context in LABELS_PER_CONTEXT;
}
