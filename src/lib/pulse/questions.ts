/**
 * Which questions a single person gets, and in which order.
 *
 * Two instruments, both randomised per person:
 *
 *   flits   4 gescoorde vragen + 1 open vraag  = 5 vragen
 *   diepte  11 gescoorde vragen + 1 open vraag = 12 vragen
 *
 * The draw is stratified over the four themes, so "random" never means one
 * person answering four werkdruk-vragen and nothing else — every flits still
 * touches every theme, and a diepte covers all four with 3/3/3/2.
 *
 * The randomness is *seeded on the invite token*: the same link always renders
 * the same questions in the same order, however often it is opened. That is
 * what makes the frozen `np_invites.question_ids` and the page agree, and it
 * is why a half-finished form can be reopened without the questions moving.
 */

export type PulseKind = "flits" | "diepte";

export type PoolQuestion = { id: string; code: string; theme: string; text: string };

/** Scored items per instrument; every instrument adds exactly one open text. */
export const SCORED_PER_KIND: Record<PulseKind, number> = { flits: 4, diepte: 11 };

/** What the invitation promises: "5 vragen" / "12 vragen", open text included. */
export function questionCount(kind: PulseKind): number {
  return SCORED_PER_KIND[kind] + 1;
}

const THEME_ORDER = ["WD", "OR", "SV", "WZ"];

/** FNV-1a — a small, stable string hash. Not a cryptographic one; not used as one. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: same seed, same sequence, in any runtime. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates on a copy, driven by the seeded generator. */
function shuffle<T>(items: readonly T[], next: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * How many scored items each theme contributes.
 *
 * 4 -> one per theme. 11 -> three themes give 3 and one gives 2; which theme is
 * short is part of the draw, so it is not always the same theme losing an item.
 */
function perTheme(scored: number, themes: string[], next: () => number): Map<string, number> {
  const base = Math.floor(scored / themes.length);
  const remainder = scored % themes.length;
  const lucky = new Set(shuffle(themes, next).slice(0, remainder));
  return new Map(themes.map((theme) => [theme, base + (lucky.has(theme) ? 1 : 0)]));
}

/**
 * Draw one person's question set from the pool.
 *
 * Returns the questions in the order they should be answered — the caller
 * stores exactly these ids on the invite, and the form renders exactly this
 * order.
 */
export function drawQuestions(
  pool: PoolQuestion[],
  kind: PulseKind,
  seed: string,
): PoolQuestion[] {
  const next = rng(hash(seed));
  const scored = SCORED_PER_KIND[kind];

  const byTheme = new Map<string, PoolQuestion[]>();
  for (const question of pool) {
    const list = byTheme.get(question.theme);
    if (list) list.push(question);
    else byTheme.set(question.theme, [question]);
  }

  // Keep a stable theme order for the draw itself; the questions get shuffled
  // afterwards, so the form does not walk the themes in a predictable block.
  const themes = THEME_ORDER.filter((theme) => (byTheme.get(theme)?.length ?? 0) > 0);
  for (const theme of byTheme.keys()) if (!themes.includes(theme)) themes.push(theme);

  if (!themes.length) return [];

  const wanted = perTheme(scored, themes, next);
  const drawn: PoolQuestion[] = [];
  for (const theme of themes) {
    const available = shuffle(byTheme.get(theme) ?? [], next);
    drawn.push(...available.slice(0, wanted.get(theme) ?? 0));
  }

  // A thin theme (fewer questions than its share) would leave the set short.
  // Top up from whatever is left rather than sending someone four questions
  // when they were promised five.
  if (drawn.length < scored) {
    const taken = new Set(drawn.map((question) => question.id));
    for (const question of shuffle(pool, next)) {
      if (drawn.length >= scored) break;
      if (!taken.has(question.id)) drawn.push(question);
    }
  }

  return shuffle(drawn.slice(0, scored), next);
}
