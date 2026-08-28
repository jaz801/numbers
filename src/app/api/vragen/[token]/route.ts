/**
 * The invite link's own endpoint.
 *
 *   GET  — the questions frozen on this invite, in their frozen order.
 *   POST — the answers, one write, and an immediate recompute of the insights.
 *
 * The token is the identity; there is no account. That means two things are
 * load-bearing here: an unknown token must be indistinguishable from a used
 * one in what it leaks, and a completed invite must not accept a second set of
 * answers.
 */

import type { Invite, MemberType, Pulse } from "@/lib/db";
import { insert, sb, SupabaseError } from "@/lib/supabase";
import { loadState } from "@/lib/pulse/state";
import { generateInsightsOnce } from "@/lib/pulse/insights";
import type { PulseKind } from "@/lib/pulse/questions";

export const runtime = "nodejs";

type Params = { params: Promise<{ token: string }> };

type QuestionRow = { id: string; code: string; theme: string; text: string };

export type InviteView = {
  pulseId: string;
  kind: PulseKind;
  label: string;
  completed: boolean;
  questions: QuestionRow[];
  /** Open text included — "vraag 5 van 5" must match the invitation. */
  total: number;
};

async function loadInvite(token: string) {
  const invites = await sb<Invite[]>(
    `np_invites?token=eq.${encodeURIComponent(token)}&select=*&limit=1`,
  );
  const invite = invites?.[0];
  if (!invite) return null;

  const [pulses, questions] = await Promise.all([
    sb<(Pulse & { kind: PulseKind })[]>(`np_pulses?id=eq.${invite.pulse_id}&select=*&limit=1`),
    sb<QuestionRow[]>(
      `np_questions?select=id,code,theme,text&id=in.(${invite.question_ids.join(",")})`,
    ),
  ]);
  const pulse = pulses?.[0];
  if (!pulse) return null;

  // Restore the frozen order: PostgREST returns rows in its own order, and the
  // order the person was given is part of what was frozen.
  const byId = new Map(questions.map((question) => [question.id, question]));
  const ordered = invite.question_ids.flatMap((id) => {
    const question = byId.get(id);
    return question ? [question] : [];
  });

  return { invite, pulse, questions: ordered };
}

/** Shared by both handlers so a missing and a stale token read the same. */
function notFound() {
  return Response.json({ error: "Deze link bestaat niet (meer)." }, { status: 404 });
}

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  try {
    const found = await loadInvite(token);
    if (!found) return notFound();

    const view: InviteView = {
      pulseId: found.pulse.id,
      kind: found.pulse.kind === "diepte" ? "diepte" : "flits",
      label: found.pulse.label,
      completed: Boolean(found.invite.completed_at),
      questions: found.questions,
      total: found.questions.length + 1,
    };
    return Response.json(view);
  } catch (error) {
    const status = error instanceof SupabaseError ? error.status : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status },
    );
  }
}

type SubmitBody = { scores?: Record<string, number>; openText?: string };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return Response.json({ error: "Ongeldige inzending." }, { status: 400 });
  }

  try {
    const found = await loadInvite(token);
    if (!found) return notFound();
    if (found.invite.completed_at) {
      return Response.json({ error: "Deze pulse is al ingevuld." }, { status: 409 });
    }

    const allowed = new Set(found.questions.map((question) => question.id));
    const scores = Object.entries(body.scores ?? {}).filter(
      ([id, score]) => allowed.has(id) && Number.isInteger(score) && score >= 1 && score <= 5,
    );
    if (scores.length !== found.questions.length) {
      return Response.json(
        { error: `Beantwoord alle ${found.questions.length} vragen.` },
        { status: 422 },
      );
    }

    const openText = (body.openText ?? "").trim().slice(0, 4000) || null;
    const segment: MemberType = found.invite.segment;

    // Write the answers before touching the invite. Closing the invite first
    // would mean a failed write costs the person their answers *and* their
    // link: they would come back to "al ingevuld" with nothing stored.
    //
    // The insert also carries `invite_id`, whose unique index is the only
    // atomic guard against a double submit — the `completed_at` check above is
    // a read-then-write and a retried request can slip between the two.
    let response: { id: string } | undefined;
    try {
      [response] = await insert<{ id: string }>("np_responses", [
        {
          pulse_id: found.pulse.id,
          invite_id: found.invite.id,
          segment,
          open_text: openText,
        },
      ]);
    } catch (error) {
      // 409 from the store here means the unique index caught a second submit.
      if (error instanceof SupabaseError && error.status === 409) {
        return Response.json({ error: "Deze pulse is al ingevuld." }, { status: 409 });
      }
      throw error;
    }
    if (!response) throw new Error("Het antwoord kon niet worden opgeslagen.");

    const written = response.id;
    try {
      await insert("np_answers", [
        ...scores.map(([question_id, score]) => ({
          response_id: written,
          question_id,
          score,
        })),
      ]);
    } catch (error) {
      // A response row without answers would count as a respondent for the rest
      // of the round and shift every later version key. Take it back out.
      await sb(`np_responses?id=eq.${encodeURIComponent(written)}`, { method: "DELETE" }).catch(
        () => undefined,
      );
      throw error;
    }

    await sb(`np_invites?id=eq.${encodeURIComponent(found.invite.id)}`, {
      method: "PATCH",
      body: { completed_at: new Date().toISOString() },
    });

    // Anonymity, as the invitation promises it: cut the link to the person the
    // moment the answers are safely written. `segment` survives, so the
    // dashboard can still split intern/extern.
    const settings = (found.pulse.settings ?? {}) as Record<string, unknown>;
    if (settings.anonymous !== false) {
      await sb(`np_responses?id=eq.${encodeURIComponent(written)}`, {
        method: "PATCH",
        body: { invite_id: null },
      });
    }

    // Everything the person submitted is stored by now. Recomputing is a
    // courtesy to the dashboard, so it may never turn a saved submission into
    // an error on their screen — the poll picks it up either way.
    try {
      const state = await loadState(found.pulse.id);
      if (state) await generateInsightsOnce(state);
    } catch {
      // Deliberately swallowed; see above.
    }

    return Response.json({ ok: true, pulseId: found.pulse.id }, { status: 201 });
  } catch (error) {
    const status = error instanceof SupabaseError ? error.status : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status },
    );
  }
}
