/**
 * Stand-ins for the two I/O modules insights.ts imports at the top of the file.
 *
 * `validate` and `allowedNumbers` are pure — they never reach the database or
 * the model — but importing the module they live in would pull in the Supabase
 * and OpenRouter clients (and, through them, server-only bundler markers).
 * The resolve hook points those imports here instead. Nothing in the suite
 * calls any of it; every stub throws, so a test that does reach for the network
 * or the database fails loudly rather than quietly passing.
 */

const unreachable = (name: string): never => {
  throw new Error(`${name} is niet beschikbaar in de unit tests; deze laag doet geen I/O`);
};

export const DEFAULT_MODEL = "test/geen-model";

export class OpenRouterError extends Error {}

export function sb(): never {
  return unreachable("sb");
}

export function upsert(): never {
  return unreachable("upsert");
}

export function callJson(): never {
  return unreachable("callJson");
}
