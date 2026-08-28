/**
 * Layer A — the deterministic half. Pure functions, no I/O, no model.
 *
 * Everything the dashboard shows as a number is computed here, so the numbers
 * exist and stay correct even when the model layer is switched off. The model
 * may cite these figures; it may never produce one.
 *
 * Deliberately modest at this size: counts and distributions, not intervals.
 * With four answers a percentage is three people wearing a lab coat.
 */

export type ScoredAnswer = { theme: string; questionCode: string; score: number };

export type ThemeStat = {
  theme: string;
  /** How many scored answers landed on this theme this round. */
  answers: number;
  /** Full 1-5 distribution: `counts[0]` is how often a 1 was given. */
  counts: [number, number, number, number, number];
  /** Score 4 or 5, as a count. Percentages only make sense above the threshold. */
  top2: number;
  /** Score 1 or 2. */
  bottom2: number;
  /** Secondary by design — the mean of a five-point item is a convenience. */
  mean: number;
};

export type PulseStats = {
  invited: number;
  responded: number;
  /** 0-1, fully observed: no inference, and the earliest signal there is. */
  responseRate: number;
  thresholdN: number;
  /** Below the threshold nothing may be split, ranked as fact, or called urgent. */
  belowThreshold: boolean;
  answers: number;
  themes: ThemeStat[];
  /** Themes ordered lowest mean first — a gespreksagenda, not a verdict. */
  agenda: string[];
};

const EMPTY: [number, number, number, number, number] = [0, 0, 0, 0, 0];

export function computeStats(
  invited: number,
  responses: { answers: ScoredAnswer[] }[],
  thresholdN: number,
): PulseStats {
  const byTheme = new Map<string, ScoredAnswer[]>();
  let total = 0;

  for (const response of responses) {
    for (const answer of response.answers) {
      total++;
      const list = byTheme.get(answer.theme);
      if (list) list.push(answer);
      else byTheme.set(answer.theme, [answer]);
    }
  }

  const themes: ThemeStat[] = [...byTheme.entries()].map(([theme, answers]) => {
    const counts = EMPTY.slice() as [number, number, number, number, number];
    let sum = 0;
    for (const answer of answers) {
      const index = Math.min(5, Math.max(1, Math.round(answer.score))) - 1;
      counts[index]!++;
      sum += answer.score;
    }
    return {
      theme,
      answers: answers.length,
      counts,
      top2: counts[3]! + counts[4]!,
      bottom2: counts[0]! + counts[1]!,
      mean: answers.length ? sum / answers.length : 0,
    };
  });

  themes.sort((a, b) => a.mean - b.mean);

  return {
    invited,
    responded: responses.length,
    responseRate: invited ? responses.length / invited : 0,
    thresholdN,
    belowThreshold: responses.length < thresholdN,
    answers: total,
    themes,
    agenda: themes.map((theme) => theme.theme),
  };
}

/**
 * The one line that decides how hard anything downstream is allowed to talk.
 *
 * Below the disclosure threshold every claim is capped at `laag`, whatever the
 * numbers look like: at n = 4 there is no such thing as an urgent finding, only
 * an urgent-looking one.
 */
export function urgencyCeiling(stats: PulseStats): "laag" | "midden" | "hoog" {
  if (stats.belowThreshold) return "laag";
  return stats.responseRate < 0.6 ? "midden" : "hoog";
}
