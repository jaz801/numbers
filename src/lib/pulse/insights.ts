/**
 * Layer B+C — the read call, collapsed into one call per recompute.
 *
 * The plan (docs/data-pipeline-plan.md §4-5) splits coding the open texts from
 * writing the insight. This live version does both in one call, on purpose:
 * the dashboard re-reads on every submitted answer, and at four open sentences
 * a second round trip buys structure nobody sees. What the split was protecting
 * is kept where it actually bites — the model never produces a number that the
 * validator cannot resolve against Layer A, and it never sees a name, a label
 * or a suppressed cell.
 *
 * Results are cached per (pulse, aantal antwoorden). Re-reading a round that
 * has not changed costs nothing and returns the identical text.
 */

import { createHash } from "node:crypto";
import { THEMAS } from "@/components/welzijn/data";
import { sb, upsert } from "@/lib/supabase";
import { urgencyCeiling, type PulseStats } from "./stats";
import { callJson, DEFAULT_MODEL, OpenRouterError } from "@/lib/openrouter";
import type { InsightItem, InsightVersion, RoundState } from "./state";

const URGENCIES = ["laag", "midden", "hoog"] as const;
const RANK: Record<string, number> = { laag: 0, midden: 1, hoog: 2 };

const THEME_NAMES = new Map(THEMAS.map((thema) => [thema.key, thema.naam]));

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["samenvatting", "inzichten"],
  properties: {
    samenvatting: { type: "string" },
    inzichten: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kop", "bewijs", "actie", "urgentie"],
        properties: {
          kop: { type: "string" },
          bewijs: { type: "string" },
          actie: { type: "string" },
          urgentie: { type: "string", enum: [...URGENCIES] },
        },
      },
    },
  },
} as const;

const SYSTEM = `Je leest de uitkomst van een welzijnspulse bij een klein
boekhoudkantoor en schrijft er een gespreksagenda bij, in het Nederlands.

Harde regels:
- Je verzint nooit een getal. Elk getal in "bewijs" moet letterlijk in de
  meegeleverde cijfers staan. Twijfel je, schrijf het dan zonder getal.
- Je beschrijft wat er staat, je diagnosticeert niemand. Geen uitspraken over
  personen, gezondheid of wie wat geantwoord zou hebben.
- Bij weinig antwoorden schrijf je voorzichtig: dit is een agenda voor een
  gesprek, geen meting. "Nog te weinig antwoorden om iets te zeggen" is een
  goed antwoord.
- "actie" is één concrete stap die een leidinggevende deze maand kan zetten.
- Kort en zakelijk. Geen jargon, geen aanhalingstekens om losse woorden.`;

/** Every numeral the model is allowed to use, as strings. */
export function allowedNumbers(stats: PulseStats): Set<string> {
  const allowed = new Set<string>();
  const add = (value: number) => {
    allowed.add(String(value));
    allowed.add(value.toFixed(1).replace(".", ","));
    allowed.add(value.toFixed(1));
  };
  add(stats.invited);
  add(stats.responded);
  add(stats.answers);
  add(stats.thresholdN);
  // Above the threshold the prompt stops insisting on counts, so the rates the
  // dashboard itself shows have to be citable — otherwise a correct "67% gaf
  // een 4 of 5" is thrown away as an invented figure.
  if (!stats.belowThreshold) {
    add(Math.round(stats.responseRate * 100));
    for (const theme of stats.themes) {
      if (!theme.answers) continue;
      add(Math.round((theme.top2 / theme.answers) * 100));
      add(Math.round((theme.bottom2 / theme.answers) * 100));
    }
  }
  for (const theme of stats.themes) {
    add(theme.answers);
    add(theme.top2);
    add(theme.bottom2);
    add(Number(theme.mean.toFixed(1)));
    for (const count of theme.counts) add(count);
    for (let score = 1; score <= 5; score++) add(score);
  }
  return allowed;
}

/** Every figure in `text` that Layer A cannot account for. */
export function unresolvedNumbers(text: string, stats: PulseStats): string[] {
  const allowed = allowedNumbers(stats);
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).filter((numeral) => !allowed.has(numeral));
}

/**
 * Deterministic gate on the model's output.
 *
 * Drops an insight rather than the whole set when one claim does not hold up:
 * a round that produced three good findings and one invented figure should
 * show three findings, not an error.
 */
export function validate(
  items: InsightItem[],
  stats: PulseStats,
  ceiling: "laag" | "midden" | "hoog",
  max: number,
): { kept: InsightItem[]; errors: string[] } {
  const allowed = allowedNumbers(stats);
  const errors: string[] = [];
  const kept: InsightItem[] = [];

  for (const item of items) {
    if (kept.length >= max) {
      errors.push(`meer dan ${max} inzichten; "${item.kop}" niet getoond`);
      continue;
    }
    if (!item.kop?.trim() || !item.bewijs?.trim() || !item.actie?.trim()) {
      errors.push("inzicht zonder kop, bewijs of actie");
      continue;
    }
    const unresolved = (item.bewijs.match(/\d+(?:[.,]\d+)?/g) ?? []).filter(
      (numeral) => !allowed.has(numeral),
    );
    if (unresolved.length) {
      errors.push(`onherleidbaar getal in "${item.kop}": ${unresolved.join(", ")}`);
      continue;
    }
    const urgentie = URGENCIES.includes(item.urgentie) ? item.urgentie : "laag";
    // The cap is the whole noise gate: at n below the threshold nothing is urgent.
    const capped = RANK[urgentie]! > RANK[ceiling]! ? ceiling : urgentie;
    if (capped !== urgentie) errors.push(`urgentie "${item.kop}" verlaagd naar ${capped}`);
    kept.push({ ...item, urgentie: capped });
  }

  return { kept, errors };
}

function prompt(state: RoundState): string {
  const { stats } = state;
  const lines: string[] = [];

  lines.push(`Ronde: ${state.label} (${state.kind === "diepte" ? "dieptepulse" : "flitspulse"}).`);
  lines.push(`Antwoorden: ${stats.responded} van ${stats.invited} uitgenodigd.`);
  lines.push(
    stats.belowThreshold
      ? `Let op: onder de drempel van ${stats.thresholdN} antwoorden. Rapporteer in aantallen, niet in percentages, en houd elke conclusie voorzichtig.`
      : `Boven de drempel van ${stats.thresholdN} antwoorden.`,
  );
  lines.push("");
  lines.push("Cijfers per thema (schaal 1-5, verdeling is hoe vaak 1,2,3,4,5 gegeven is):");
  for (const theme of stats.themes) {
    lines.push(
      `- ${THEME_NAMES.get(theme.theme) ?? theme.theme}: ${theme.answers} antwoorden, ` +
        `verdeling ${theme.counts.join("/")}, ${theme.top2} keer een 4 of 5, ` +
        `${theme.bottom2} keer een 1 of 2, gemiddelde ${theme.mean.toFixed(1)}.`,
    );
  }

  const texts = state.feed
    .map((item) => item.openText?.trim())
    .filter((text): text is string => Boolean(text));
  lines.push("");
  if (texts.length) {
    lines.push("Wat mensen zelf schreven (anoniem, ongeordend):");
    texts.forEach((text, i) => lines.push(`${i + 1}. ${text}`));
  } else {
    lines.push("Er is nog geen open antwoord binnen.");
  }

  const max = state.kind === "diepte" ? 4 : 2;
  lines.push("");
  lines.push(
    `Schrijf een samenvatting van maximaal twee zinnen en maximaal ${max} inzichten.`,
  );
  return lines.join("\n");
}

export type GenerateResult = {
  version: InsightVersion | null;
  cached: boolean;
  /** Why there is no fresh insight, in plain Dutch, for the dashboard to show. */
  note?: string;
};

/**
 * Produce (or reuse) the insight version for the round as it stands right now.
 *
 * Never throws on a model failure: Layer A is the product's floor, and a
 * dashboard that shows honest numbers with "de leeslaag is niet bereikbaar"
 * is worth more than one that shows an error page.
 */
export async function generateInsights(state: RoundState): Promise<GenerateResult> {
  const n = state.stats.responded;

  const existing = state.versions.find((version) => version.n_responses === n);
  if (existing) return { version: existing, cached: true };

  if (n === 0) return { version: null, cached: false, note: "Nog geen antwoorden binnen." };

  // A submit writes its response row and its answers as two calls. Reading in
  // that gap would cache "geen scores binnen" against this answer count, and
  // the cache is keyed on exactly that count — so it would stick for good.
  if (state.midWrite) {
    return { version: null, cached: false, note: "Een antwoord is nog binnen aan het komen." };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      version: null,
      cached: false,
      note: "OPENROUTER_API_KEY ontbreekt; de cijfers hieronder kloppen wel.",
    };
  }

  const user = prompt(state);
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const inputHash = createHash("sha256").update(`${model}\n${SYSTEM}\n${user}`).digest("hex");

  let result;
  try {
    result = await callJson<{ samenvatting: string; inzichten: InsightItem[] }>({
      system: SYSTEM,
      user,
      schema: SCHEMA as unknown as Record<string, unknown>,
      schemaName: "welzijn_inzichten",
      model,
      apiKey,
      referer: process.env.NEXT_PUBLIC_BASE_URL,
    });
  } catch (error) {
    const message = error instanceof OpenRouterError ? error.message : String(error);
    await logRun(state.pulseId, model, inputHash, false, [message], null);
    return { version: null, cached: false, note: "De leeslaag gaf geen antwoord op deze ronde." };
  }

  const { kept, errors } = validate(
    result.data.inzichten ?? [],
    state.stats,
    urgencyCeiling(state.stats),
    state.kind === "diepte" ? 4 : 2,
  );

  // The summary sits at the top of the card, so it gets the same treatment as
  // the evidence lines: a figure that cannot be resolved costs the sentence.
  let summary = result.data.samenvatting ?? "";
  const summaryProblems = unresolvedNumbers(summary, state.stats);
  if (summaryProblems.length) {
    errors.push(`onherleidbaar getal in de samenvatting: ${summaryProblems.join(", ")}`);
    summary = "";
  }

  await logRun(state.pulseId, result.model, inputHash, errors.length === 0, errors, result);

  const [written] = await upsert<InsightVersion>(
    "np_insight_versions",
    [
      {
        pulse_id: state.pulseId,
        n_responses: n,
        summary,
        insights: kept,
        model: result.model,
      },
    ],
    "pulse_id,n_responses",
  );

  // The current-state table the rest of the app already reads from.
  await upsert(
    "np_insights",
    [
      {
        pulse_id: state.pulseId,
        summary,
        insights: kept,
        model: result.model,
        generated_at: new Date().toISOString(),
      },
    ],
    "pulse_id",
  );

  return {
    version: written ?? {
      n_responses: n,
      summary,
      insights: kept,
      model: result.model,
      generated_at: new Date().toISOString(),
    },
    cached: false,
  };
}

async function logRun(
  pulseId: string,
  model: string,
  inputHash: string,
  valid: boolean,
  errors: string[],
  result: {
    raw: unknown;
    promptTokens?: number;
    completionTokens?: number;
    costUsd?: number;
    latencyMs: number;
  } | null,
): Promise<void> {
  try {
    await sb("np_llm_runs", {
      method: "POST",
      body: [
        {
          pulse_id: pulseId,
          stage: "insight",
          model,
          input_hash: inputHash,
          valid,
          validator_errors: errors,
          raw_response: result?.raw ?? null,
          prompt_tokens: result?.promptTokens ?? null,
          completion_tokens: result?.completionTokens ?? null,
          cost_usd: result?.costUsd ?? null,
          latency_ms: result?.latencyMs ?? null,
        },
      ],
    });
  } catch {
    // An audit row failing is not a reason to lose the insight the user is
    // waiting for; the run is still visible in the version trail.
  }
}

/**
 * The same call, but at most one in flight per (ronde, aantal antwoorden).
 *
 * The dashboard polls every three seconds and three people can submit inside
 * one second. Without this, one new answer would fan out into a handful of
 * identical model calls that all write the same row.
 */
const inFlight = new Map<string, Promise<GenerateResult>>();

export function generateInsightsOnce(state: RoundState): Promise<GenerateResult> {
  const key = `${state.pulseId}:${state.stats.responded}`;
  const running = inFlight.get(key);
  if (running) return running;

  const started = generateInsights(state).finally(() => inFlight.delete(key));
  inFlight.set(key, started);
  return started;
}
