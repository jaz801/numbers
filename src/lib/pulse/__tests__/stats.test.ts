/**
 * computeStats and urgencyCeiling — the deterministic half of the pipeline.
 *
 * The fixture is deliberately small enough to check by hand: five people
 * invited, three of whom answered two questions each.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { computeStats, urgencyCeiling, type ScoredAnswer } from "../stats.ts";

/** One response, written as `theme:score` pairs. */
function response(...pairs: string[]): { answers: ScoredAnswer[] } {
  return {
    answers: pairs.map((pair) => {
      const [theme, score] = pair.split(":");
      return { theme: theme!, questionCode: `${theme}01`, score: Number(score) };
    }),
  };
}

// WD scores 1, 2, 3 -> mean 2. OR scores 5, 4, 4 -> mean 13/3.
const RESPONSES = [
  response("WD:1", "OR:5"),
  response("WD:2", "OR:4"),
  response("WD:3", "OR:4"),
];

function theme(stats: ReturnType<typeof computeStats>, key: string) {
  const found = stats.themes.find((item) => item.theme === key);
  assert.ok(found, `thema ${key} ontbreekt in de uitkomst`);
  return found;
}

test("response rate is responded over invited, fully observed", () => {
  const stats = computeStats(5, RESPONSES, 5);
  assert.equal(stats.invited, 5);
  assert.equal(stats.responded, 3, "drie mensen hebben ingevuld");
  assert.equal(stats.responseRate, 0.6, `responsgraad is 3/5 = 0.6, niet ${stats.responseRate}`);
});

test("answers are counted per theme and in total", () => {
  const stats = computeStats(5, RESPONSES, 5);
  assert.equal(stats.answers, 6, `3 mensen x 2 vragen = 6 antwoorden, niet ${stats.answers}`);
  assert.equal(theme(stats, "WD").answers, 3);
  assert.equal(theme(stats, "OR").answers, 3);
});

test("the 1-5 distribution, top2, bottom2 and mean match the hand-computed fixture", () => {
  const stats = computeStats(5, RESPONSES, 5);

  const wd = theme(stats, "WD");
  assert.deepEqual(wd.counts, [1, 1, 1, 0, 0], `WD kreeg de scores 1,2,3; verdeling klopt niet: ${wd.counts}`);
  assert.equal(wd.top2, 0, "WD heeft geen enkele 4 of 5 gekregen");
  assert.equal(wd.bottom2, 2, "WD kreeg een 1 en een 2, dus bottom2 = 2");
  assert.equal(wd.mean, 2, `gemiddelde van 1,2,3 is 2, niet ${wd.mean}`);

  const or = theme(stats, "OR");
  assert.deepEqual(or.counts, [0, 0, 0, 2, 1], `OR kreeg de scores 5,4,4; verdeling klopt niet: ${or.counts}`);
  assert.equal(or.top2, 3, "alle drie de OR-antwoorden zijn een 4 of 5");
  assert.equal(or.bottom2, 0, "OR kreeg geen enkele 1 of 2");
  assert.equal(or.mean.toFixed(1), "4.3", `gemiddelde van 5,4,4 is 4.3, niet ${or.mean.toFixed(1)}`);
});

test("agenda orders the themes lowest mean first", () => {
  const stats = computeStats(5, RESPONSES, 5);
  assert.deepEqual(
    stats.agenda,
    ["WD", "OR"],
    `WD (2.0) hoort voor OR (4.3) te staan, maar de agenda is ${stats.agenda.join(", ")}`,
  );
  assert.deepEqual(
    stats.themes.map((item) => item.theme),
    stats.agenda,
    "de agenda loopt niet gelijk met de volgorde van de thema's",
  );
});

test("the threshold flag follows the number of responses, not the scores", () => {
  assert.equal(computeStats(5, RESPONSES, 5).belowThreshold, true, "3 antwoorden ligt onder een drempel van 5");
  assert.equal(computeStats(5, RESPONSES, 3).belowThreshold, false, "3 antwoorden haalt een drempel van 3");
  assert.equal(computeStats(5, RESPONSES, 3).thresholdN, 3, "de gebruikte drempel wordt teruggegeven");
});

test("zero responses does not divide by zero", () => {
  const stats = computeStats(10, [], 5);
  assert.equal(stats.responded, 0);
  assert.equal(stats.answers, 0);
  assert.equal(stats.responseRate, 0, `responsgraad bij 0 antwoorden moet 0 zijn, niet ${stats.responseRate}`);
  assert.ok(Number.isFinite(stats.responseRate), "responsgraad is NaN of Infinity geworden");
  assert.deepEqual(stats.themes, [], "zonder antwoorden zijn er geen thema's");
  assert.deepEqual(stats.agenda, [], "zonder antwoorden is er geen agenda");
  assert.equal(stats.belowThreshold, true, "0 antwoorden ligt altijd onder de drempel");
});

test("zero invited does not divide by zero either", () => {
  const stats = computeStats(0, [], 5);
  assert.equal(stats.responseRate, 0, `0 uitgenodigd moet 0 opleveren, niet ${stats.responseRate}`);
  assert.ok(Number.isFinite(stats.responseRate), "responsgraad is NaN geworden bij 0 uitgenodigden");
});

test("urgencyCeiling stays laag below the threshold, whatever the scores are", () => {
  // The noise gate. Every one of these looks alarming or perfect; none of them
  // has enough answers behind it to be called anything but laag.
  const extremes: { name: string; responses: { answers: ScoredAnswer[] }[] }[] = [
    { name: "alles een 1", responses: [response("WD:1", "OR:1"), response("WD:1", "OR:1")] },
    { name: "alles een 5", responses: [response("WD:5", "OR:5"), response("WD:5", "OR:5")] },
    { name: "één antwoord", responses: [response("WD:1")] },
    { name: "geen antwoord", responses: [] },
  ];

  for (const { name, responses } of extremes) {
    for (const invited of [1, 2, 100]) {
      const stats = computeStats(invited, responses, 5);
      assert.equal(stats.belowThreshold, true, `${name}: fixture zit niet onder de drempel`);
      assert.equal(
        urgencyCeiling(stats),
        "laag",
        `${name} bij ${invited} uitgenodigd: onder de drempel mag niets urgenter dan laag zijn`,
      );
    }
  }
});

test("above the threshold the ceiling follows the response rate", () => {
  const four = [response("WD:3"), response("WD:3"), response("WD:3"), response("WD:3")];

  // 4 of 10 = 40% respons: boven de drempel, maar niet representatief genoeg.
  assert.equal(
    urgencyCeiling(computeStats(10, four, 4)),
    "midden",
    "bij 40% respons boven de drempel is midden het plafond",
  );
  // 4 of 5 = 80% respons.
  assert.equal(
    urgencyCeiling(computeStats(5, four, 4)),
    "hoog",
    "bij 80% respons boven de drempel mag hoog",
  );
  // Precies 60% is de grens en telt mee.
  const six = [...four, response("WD:3"), response("WD:3")];
  assert.equal(
    urgencyCeiling(computeStats(10, six, 4)),
    "hoog",
    "precies 60% respons ligt op de grens en telt als hoog",
  );
});
