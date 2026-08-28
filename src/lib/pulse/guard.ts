/**
 * The shared secret that guards everything which creates or reveals a round.
 *
 * `PULSE_ADMIN_SECRET` if it is set, otherwise the `PULSE_TEST_SECRET` that the
 * existing test-send route already uses — one less variable to add in a hurry.
 * With neither set the guarded routes refuse to run at all, which is the right
 * default for a route that can open a round or list every link.
 */

import { timingSafeEqual } from "node:crypto";

export function expectedSecret(): string | null {
  return process.env.PULSE_ADMIN_SECRET || process.env.PULSE_TEST_SECRET || null;
}

export function secretOk(provided: string): boolean {
  const expected = expectedSecret();
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
