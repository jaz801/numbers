/**
 * Everything the live dashboard needs about one round, read in one go.
 *
 * Shared by the state endpoint and the insight generator so the model and the
 * screen can never disagree about what came in.
 */

import type { MemberType, Pulse } from "@/lib/db";
import { sb } from "@/lib/supabase";
import { computeStats, type PulseStats, type ScoredAnswer } from "./stats";
import type { PulseKind } from "./questions";

export type FeedItem = {
  /** Position in the round: "antwoord 3", never a name — the round is anonymous. */
  index: number;
  segment: MemberType;
  at: string;
  scores: { code: string; theme: string; text: string; score: number }[];
  openText: string | null;
};

export type InsightItem = {
  kop: string;
  bewijs: string;
  actie: string;
  urgentie: "laag" | "midden" | "hoog";
};

export type InsightVersion = {
  n_responses: number;
  summary: string;
  insights: InsightItem[];
  model: string | null;
  generated_at: string;
};

export type RoundState = {
  pulseId: string;
  /**
   * True while a submit is mid-write: the response row exists but its answers
   * do not. Reading a round in that gap would cache an insight for a number of
   * answers that never really happened.
   */
  midWrite: boolean;
  label: string;
  kind: PulseKind;
  mode: "demo" | "productie";
  status: string;
  stats: PulseStats;
  feed: FeedItem[];
  /** Newest first. The trail is the demo: it shows what one answer changed. */
  versions: InsightVersion[];
};

type QuestionRow = { id: string; code: string; theme: string; text: string };
type ResponseRow = { id: string; segment: MemberType; open_text: string | null; created_at: string };
type AnswerRow = { response_id: string; question_id: string; score: number };

export async function loadState(pulseId: string): Promise<RoundState | null> {
  // The id comes straight from the URL. Unencoded it could smuggle its own
  // query parameters into a service-role request.
  const id = encodeURIComponent(pulseId);

  const pulses = await sb<(Pulse & { kind: PulseKind })[]>(
    `np_pulses?id=eq.${id}&select=*&limit=1`,
  );
  const pulse = pulses?.[0];
  if (!pulse) return null;

  const settings = (pulse.settings ?? {}) as Record<string, unknown>;
  const thresholdN = typeof settings.threshold_n === "number" ? settings.threshold_n : 5;
  const mode = settings.mode === "productie" ? "productie" : "demo";

  const [invites, responses, questions] = await Promise.all([
    sb<{ id: string }[]>(`np_invites?pulse_id=eq.${id}&select=id`),
    sb<ResponseRow[]>(
      `np_responses?pulse_id=eq.${id}&select=id,segment,open_text,created_at&order=created_at.asc`,
    ),
    sb<QuestionRow[]>("np_questions?select=id,code,theme,text"),
  ]);

  const byId = new Map(questions.map((question) => [question.id, question]));

  const answers = responses.length
    ? await sb<AnswerRow[]>(
        `np_answers?select=response_id,question_id,score&response_id=in.(${responses
          .map((response) => response.id)
          .join(",")})`,
      )
    : [];

  const perResponse = new Map<string, AnswerRow[]>();
  for (const answer of answers) {
    const list = perResponse.get(answer.response_id);
    if (list) list.push(answer);
    else perResponse.set(answer.response_id, [answer]);
  }

  const feed: FeedItem[] = responses.map((response, i) => ({
    index: i + 1,
    segment: response.segment,
    at: response.created_at,
    scores: (perResponse.get(response.id) ?? []).flatMap((answer) => {
      const question = byId.get(answer.question_id);
      return question
        ? [{ code: question.code, theme: question.theme, text: question.text, score: answer.score }]
        : [];
    }),
    openText: response.open_text,
  }));

  const scored: { answers: ScoredAnswer[] }[] = feed.map((item) => ({
    answers: item.scores.map((score) => ({
      theme: score.theme,
      questionCode: score.code,
      score: score.score,
    })),
  }));

  const versions = await sb<InsightVersion[]>(
    `np_insight_versions?pulse_id=eq.${id}` +
      "&select=n_responses,summary,insights,model,generated_at&order=n_responses.desc",
  );

  return {
    pulseId,
    midWrite: feed.some((item) => item.scores.length === 0),
    label: pulse.label,
    kind: pulse.kind === "diepte" ? "diepte" : "flits",
    mode,
    status: pulse.status,
    stats: computeStats(invites.length, scored, thresholdN),
    feed,
    versions: versions ?? [],
  };
}
