/**
 * Intern or extern per audience member.
 *
 * Not a property of the person but of this pulse: it is the only split the
 * dashboard ever makes, and it is copied onto the invite at send time so the
 * answers stay usable after the invite link is cut.
 */
export const SEGMENT_PER_LID: Record<string, "intern" | "extern"> = {
  jasper: "intern",
  joep: "intern",
  kian: "extern",
};

export function segmentVan(id: string): "intern" | "extern" {
  return SEGMENT_PER_LID[id] ?? "intern";
}
