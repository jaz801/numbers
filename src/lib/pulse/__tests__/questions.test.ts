/**
 * drawQuestions: the stratified, token-seeded draw.
 *
 * The two properties that matter in production are asserted here: every draw
 * covers all four themes in the promised split, and the same invite token
 * always produces the identical list in the identical order — that is what
 * keeps the frozen `question_ids` and the rendered form in agreement.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { drawQuestions, questionCount, SCORED_PER_KIND, type PoolQuestion } from "../questions.ts";

const THEMES = ["WD", "OR", "SV", "WZ"];

/** A pool with `perTheme` questions in each of the four themes. */
function pool(perTheme: number): PoolQuestion[] {
  return THEMES.flatMap((theme) =>
    Array.from({ length: perTheme }, (_, i) => ({
      id: `${theme}${i + 1}`,
      code: `${theme}${i + 1}`,
      theme,
      text: `${theme} vraag ${i + 1}`,
    })),
  );
}

/** How many drawn questions each theme contributed, e.g. {WD: 3, OR: 3, ...}. */
function themeCounts(drawn: PoolQuestion[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const question of drawn) counts[question.theme] = (counts[question.theme] ?? 0) + 1;
  return counts;
}

function ids(drawn: PoolQuestion[]): string[] {
  return drawn.map((question) => question.id);
}

test("questionCount promises the scored items plus the one open question", () => {
  assert.equal(questionCount("flits"), 5, "een flits is 4 gescoorde vragen + 1 open vraag");
  assert.equal(questionCount("diepte"), 12, "een diepte is 11 gescoorde vragen + 1 open vraag");
});

test("flits draws exactly 4 scored questions, one per theme", () => {
  for (let i = 0; i < 50; i++) {
    const drawn = drawQuestions(pool(6), "flits", `token-${i}`);
    assert.equal(drawn.length, 4, `flits ${i} leverde ${drawn.length} vragen op in plaats van 4`);
    assert.deepEqual(
      themeCounts(drawn),
      { WD: 1, OR: 1, SV: 1, WZ: 1 },
      `flits ${i} is niet 1 vraag per thema maar ${JSON.stringify(themeCounts(drawn))}`,
    );
  }
});

test("diepte draws exactly 11 scored questions, split 3/3/3/2 over the four themes", () => {
  const shortThemes = new Set<string>();

  for (let i = 0; i < 50; i++) {
    const drawn = drawQuestions(pool(6), "diepte", `token-${i}`);
    assert.equal(drawn.length, 11, `diepte ${i} leverde ${drawn.length} vragen op in plaats van 11`);

    const counts = themeCounts(drawn);
    assert.deepEqual(
      Object.keys(counts).sort(),
      [...THEMES].sort(),
      `diepte ${i} raakt niet alle vier de thema's: ${JSON.stringify(counts)}`,
    );
    assert.deepEqual(
      Object.values(counts).sort(),
      [2, 3, 3, 3],
      `diepte ${i} is niet 3/3/3/2 verdeeld maar ${JSON.stringify(counts)}`,
    );

    const short = Object.entries(counts).find(([, count]) => count === 2)?.[0];
    if (short) shortThemes.add(short);
  }

  assert.ok(
    shortThemes.size > 1,
    `het thema dat er één vraag bij inschiet is altijd hetzelfde (${[...shortThemes].join(", ")})`,
  );
});

test("a draw never contains the same question twice", () => {
  for (const kind of ["flits", "diepte"] as const) {
    for (let i = 0; i < 100; i++) {
      const drawn = drawQuestions(pool(6), kind, `token-${i}`);
      assert.equal(
        new Set(ids(drawn)).size,
        drawn.length,
        `${kind} ${i} bevat een dubbele vraag: ${ids(drawn).join(", ")}`,
      );
    }
  }
});

test("the same token always yields the identical questions in the identical order", () => {
  for (const kind of ["flits", "diepte"] as const) {
    const first = drawQuestions(pool(6), kind, "invite-abc123");
    for (let repeat = 0; repeat < 5; repeat++) {
      const again = drawQuestions(pool(6), kind, "invite-abc123");
      assert.deepEqual(
        ids(again),
        ids(first),
        `${kind}: dezelfde token gaf een andere volgorde; ${ids(first).join(",")} werd ${ids(again).join(",")}`,
      );
    }
  }
});

test("different tokens spread over many different question sets", () => {
  const sets = new Set<string>();
  const orders = new Set<string>();
  for (let i = 0; i < 300; i++) {
    const drawn = drawQuestions(pool(6), "flits", `invite-${i}`);
    sets.add([...ids(drawn)].sort().join(","));
    orders.add(ids(drawn).join(","));
  }
  assert.ok(sets.size > 50, `300 tokens leverden maar ${sets.size} verschillende vragensets op`);
  assert.ok(
    orders.size > sets.size,
    `de volgorde varieert niet los van de set (${orders.size} volgordes bij ${sets.size} sets)`,
  );
});

test("an empty pool draws nothing instead of throwing", () => {
  assert.deepEqual(drawQuestions([], "flits", "token"), []);
});

test("a pool smaller than the instrument returns every question it has, once", () => {
  // Two themes, one question each: the top-up branch has nothing left to add,
  // so the contract is "as many distinct questions as exist", not "4".
  const tiny: PoolQuestion[] = [
    { id: "WD1", code: "WD1", theme: "WD", text: "a" },
    { id: "OR1", code: "OR1", theme: "OR", text: "b" },
  ];
  const drawn = drawQuestions(tiny, "flits", "token");
  assert.equal(drawn.length, 2, `een pool van 2 vragen gaf ${drawn.length} vragen terug`);
  assert.deepEqual([...ids(drawn)].sort(), ["OR1", "WD1"], "niet elke beschikbare vraag is gebruikt");
  assert.equal(new Set(ids(drawn)).size, 2, "de te kleine pool is aangevuld met een dubbele vraag");
});

test("one thin theme is topped up from the rest of the pool, without duplicating", () => {
  // WZ has a single question while the diepte wants 2 or 3 from it; the top-up
  // branch must fill the set back to 11 from the other themes.
  const thin: PoolQuestion[] = [
    ...pool(6).filter((question) => question.theme !== "WZ"),
    { id: "WZ1", code: "WZ1", theme: "WZ", text: "wz" },
  ];

  for (let i = 0; i < 50; i++) {
    const drawn = drawQuestions(thin, "diepte", `token-${i}`);
    assert.equal(
      drawn.length,
      SCORED_PER_KIND.diepte,
      `een dun thema maakte de set korter: ${drawn.length} in plaats van 11 (token-${i})`,
    );
    assert.equal(
      new Set(ids(drawn)).size,
      drawn.length,
      `de aanvulling herhaalde een vraag: ${ids(drawn).join(", ")}`,
    );
    assert.ok(
      themeCounts(drawn).WZ === undefined || themeCounts(drawn).WZ === 1,
      `het dunne thema WZ leverde ${themeCounts(drawn).WZ} vragen terwijl het er maar 1 heeft`,
    );
  }
});
