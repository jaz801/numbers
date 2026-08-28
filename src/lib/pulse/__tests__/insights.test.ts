/**
 * The deterministic gate on the model's output.
 *
 * `validate` is the only thing standing between a plausible sentence and the
 * dashboard, so it is tested against the same hand-computed fixture as
 * stats.test.ts: five invited, three responses of two answers each.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { allowedNumbers, validate } from "../insights.ts";
import { computeStats, urgencyCeiling, type ScoredAnswer } from "../stats.ts";
import type { InsightItem } from "../state.ts";

function response(...pairs: string[]): { answers: ScoredAnswer[] } {
  return {
    answers: pairs.map((pair) => {
      const [theme, score] = pair.split(":");
      return { theme: theme!, questionCode: `${theme}01`, score: Number(score) };
    }),
  };
}

// invited 5, responded 3, answers 6; WD scores 1,2,3 and OR scores 5,4,4.
const STATS = computeStats(
  5,
  [response("WD:1", "OR:5"), response("WD:2", "OR:4"), response("WD:3", "OR:4")],
  5,
);

function insight(over: Partial<InsightItem> = {}): InsightItem {
  return {
    kop: "Werkdruk vraagt aandacht",
    bewijs: "3 van de 5 mensen vulden in; werkdruk kreeg 2 keer een 1 of 2.",
    actie: "Bespreek de werkverdeling in het teamoverleg.",
    urgentie: "laag",
    ...over,
  };
}

test("allowedNumbers holds the figures Layer A actually produced, and nothing else", () => {
  const allowed = allowedNumbers(STATS);
  for (const figure of ["5", "3", "6", "2", "0", "4,3", "4.3"]) {
    assert.ok(allowed.has(figure), `${figure} komt uit de cijfers en hoort toegestaan te zijn`);
  }
  for (const invented of ["12", "87", "40"]) {
    assert.ok(!allowed.has(invented), `${invented} staat nergens in de cijfers en mag niet passeren`);
  }
});

test("an insight citing a figure that is not in the stats is dropped", () => {
  const { kept, errors } = validate(
    [insight({ kop: "Verzonnen cijfer", bewijs: "12 van de 5 mensen noemen werkdruk." })],
    STATS,
    "hoog",
    4,
  );
  assert.equal(kept.length, 0, `het inzicht met het getal 12 is toch getoond: ${JSON.stringify(kept)}`);
  assert.match(
    errors.join(" | "),
    /onherleidbaar getal.*12/,
    `de validator meldt het verzonnen getal niet: ${errors.join(" | ")}`,
  );
});

test("an insight citing a real figure survives untouched", () => {
  const item = insight({ bewijs: "Werkdruk kreeg 2 keer een 1 of 2, bij 3 antwoorden." });
  const { kept, errors } = validate([item], STATS, "hoog", 4);
  assert.equal(kept.length, 1, `een inzicht met alleen echte cijfers is gesneuveld: ${errors.join(" | ")}`);
  assert.deepEqual(kept[0], item, "het inzicht is onderweg veranderd");
  assert.deepEqual(errors, [], `er zijn onverwachte validatiefouten: ${errors.join(" | ")}`);
});

test("an insight without any numbers passes the number check", () => {
  const { kept } = validate([insight({ bewijs: "Meerdere mensen noemen de werkdruk." })], STATS, "hoog", 4);
  assert.equal(kept.length, 1, "een inzicht zonder getallen heeft niets te herleiden en hoort te blijven");
});

test("urgency above the ceiling is capped, not dropped", () => {
  const { kept, errors } = validate([insight({ urgentie: "hoog" })], STATS, "laag", 4);
  assert.equal(kept.length, 1, "het inzicht is weggegooid in plaats van afgetopt");
  assert.equal(
    kept[0]!.urgentie,
    "laag",
    `urgentie is ${kept[0]!.urgentie} gebleven terwijl het plafond laag is`,
  );
  assert.match(errors.join(" | "), /verlaagd naar laag/, `de aftopping is niet gelogd: ${errors.join(" | ")}`);
});

test("urgency at or below the ceiling is left alone", () => {
  const { kept, errors } = validate(
    [insight({ kop: "A", urgentie: "laag" }), insight({ kop: "B", urgentie: "midden" })],
    STATS,
    "midden",
    4,
  );
  assert.deepEqual(
    kept.map((item) => item.urgentie),
    ["laag", "midden"],
    "een urgentie onder het plafond is toch aangepast",
  );
  assert.deepEqual(errors, [], `onverwachte fouten: ${errors.join(" | ")}`);
});

test("below the threshold the ceiling from Layer A caps everything to laag", () => {
  // The end-to-end version of the noise gate: three answers, threshold five.
  assert.equal(urgencyCeiling(STATS), "laag");
  const { kept } = validate(
    [insight({ kop: "A", urgentie: "hoog" }), insight({ kop: "B", urgentie: "midden" })],
    STATS,
    urgencyCeiling(STATS),
    4,
  );
  assert.deepEqual(
    kept.map((item) => item.urgentie),
    ["laag", "laag"],
    "onder de drempel is er alsnog iets urgenters dan laag doorgekomen",
  );
});

test("more insights than the maximum are dropped, keeping the first ones", () => {
  const items = ["A", "B", "C", "D"].map((kop) => insight({ kop }));
  const { kept, errors } = validate(items, STATS, "hoog", 2);
  assert.equal(kept.length, 2, `bij max 2 zijn er ${kept.length} inzichten overgebleven`);
  assert.deepEqual(kept.map((item) => item.kop), ["A", "B"], "niet de eerste twee inzichten zijn bewaard");
  assert.equal(errors.length, 2, `beide overtollige inzichten horen gemeld te worden: ${errors.join(" | ")}`);
  assert.match(errors.join(" | "), /meer dan 2 inzichten/, `het maximum wordt niet gemeld: ${errors.join(" | ")}`);
});

test("an insight missing kop, bewijs or actie is dropped", () => {
  for (const missing of ["kop", "bewijs", "actie"] as const) {
    const { kept, errors } = validate([insight({ [missing]: "" })], STATS, "hoog", 4);
    assert.equal(kept.length, 0, `een inzicht zonder ${missing} is toch getoond`);
    assert.match(
      errors.join(" | "),
      /zonder kop, bewijs of actie/,
      `ontbrekende ${missing} wordt niet gemeld: ${errors.join(" | ")}`,
    );
  }
  // Whitespace is not content either.
  assert.equal(validate([insight({ actie: "   " })], STATS, "hoog", 4).kept.length, 0, "spaties tellen als actie");
});

test("an empty set of insights validates to an empty set", () => {
  const { kept, errors } = validate([], STATS, "laag", 4);
  assert.deepEqual(kept, []);
  assert.deepEqual(errors, []);
});
