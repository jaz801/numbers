/**
 * POST /api/rondes — open a round and hand back the links.
 *
 * Sends nothing. It creates the pulse, freezes a randomised question set per
 * person, and returns one link each plus the dashboard link. The links go out
 * by hand, which is exactly why this exists: no template, no domain warm-up,
 * no send window between deciding to run a round and running it.
 *
 * Guarded by the admin secret: this route can enumerate every invite link in
 * a round, and an invite link is the identity.
 */

import { createRound } from "@/lib/pulse/round";
import { secretOk } from "@/lib/pulse/guard";
import type { PulseKind } from "@/lib/pulse/questions";
import type { MemberType, PulseStatus } from "@/lib/db";
import { sb, SupabaseError } from "@/lib/supabase";

export const runtime = "nodejs";

type Body = { kind?: string; label?: string; mode?: string };

export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const provided = request.headers.get("x-pulse-secret") ?? params.get("secret") ?? "";
  if (!secretOk(provided)) {
    return Response.json({ error: "Onjuist of ontbrekend pulse-secret." }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // An empty body is fine; everything below has a default.
  }

  const kind: PulseKind = (body.kind ?? params.get("kind")) === "diepte" ? "diepte" : "flits";
  const label =
    (body.label ?? params.get("label") ?? "").trim() ||
    `${kind === "diepte" ? "Dieptepulse" : "Flitspulse"} ${new Date().toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
    })}`;
  const mode = (body.mode ?? params.get("mode")) === "productie" ? "productie" : "demo";
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin).replace(/\/$/, "");

  try {
    const round = await createRound(kind, label, baseUrl, mode);
    return Response.json(round, { status: 201 });
  } catch (error) {
    const status = error instanceof SupabaseError ? error.status : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: status === 503 ? 503 : 500 },
    );
  }
}

/**
 * GET /api/rondes — the recent rounds with their links, so a refresh is survivable.
 *
 * The links are only ever shown once by POST, and a link is the only way in:
 * losing the tab means losing the round. This reads them back — newest rounds
 * first — with, per invite, whether that person already answered.
 *
 * Same guard as POST, and for the same reason: this enumerates every invite
 * link, and an invite link is the identity.
 */

type PulseRow = {
  id: string;
  label: string;
  kind: string;
  status: PulseStatus;
  created_at: string;
};

type InviteRow = {
  pulse_id: string;
  person_id: string;
  token: string;
  segment: MemberType;
  completed_at: string | null;
  created_at: string;
};

type PersonRow = { id: string; name: string; email: string };

type ResponseRow = { pulse_id: string };

export type ExistingLink = {
  person: string;
  email: string;
  segment: MemberType;
  url: string;
  /** Null until this person submitted; the list of who still needs a nudge. */
  completedAt: string | null;
};

export type ExistingRound = {
  pulseId: string;
  label: string;
  kind: PulseKind;
  status: PulseStatus;
  createdAt: string;
  dashboardUrl: string;
  responseCount: number;
  links: ExistingLink[];
};

/** PostgREST `in.()` over uuids, matching how the other np_ reads build it. */
function inList(ids: string[]): string {
  return `in.(${ids.join(",")})`;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const provided = request.headers.get("x-pulse-secret") ?? params.get("secret") ?? "";
  if (!secretOk(provided)) {
    return Response.json({ error: "Onjuist of ontbrekend pulse-secret." }, { status: 401 });
  }

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin).replace(/\/$/, "");

  try {
    const pulses = await sb<PulseRow[]>(
      "np_pulses?select=id,label,kind,status,created_at&order=created_at.desc&limit=20",
    );
    if (!pulses?.length) return Response.json({ rounds: [] });

    const pulseIds = pulses.map((pulse) => pulse.id);
    const [invites, responses] = await Promise.all([
      sb<InviteRow[]>(
        `np_invites?pulse_id=${inList(pulseIds)}` +
          "&select=pulse_id,person_id,token,segment,completed_at,created_at&order=created_at.asc",
      ),
      sb<ResponseRow[]>(`np_responses?pulse_id=${inList(pulseIds)}&select=pulse_id`),
    ]);

    const personIds = [...new Set(invites.map((invite) => invite.person_id))];
    const people = personIds.length
      ? await sb<PersonRow[]>(`np_people?id=${inList(personIds)}&select=id,name,email`)
      : [];
    const byPerson = new Map(people.map((person) => [person.id, person]));

    const perPulse = new Map<string, ExistingLink[]>();
    for (const invite of invites) {
      const person = byPerson.get(invite.person_id);
      const link: ExistingLink = {
        person: person?.name ?? "Onbekend",
        email: person?.email ?? "",
        segment: invite.segment,
        // Rebuilt the same way createRound builds it — the token is the link.
        url: `${base}/vragen/${invite.token}`,
        completedAt: invite.completed_at,
      };
      const list = perPulse.get(invite.pulse_id);
      if (list) list.push(link);
      else perPulse.set(invite.pulse_id, [link]);
    }

    const counts = new Map<string, number>();
    for (const response of responses) {
      counts.set(response.pulse_id, (counts.get(response.pulse_id) ?? 0) + 1);
    }

    const rounds: ExistingRound[] = pulses.map((pulse) => ({
      pulseId: pulse.id,
      label: pulse.label,
      kind: pulse.kind === "diepte" ? "diepte" : "flits",
      status: pulse.status,
      createdAt: pulse.created_at,
      dashboardUrl: `${base}/live/${pulse.id}`,
      responseCount: counts.get(pulse.id) ?? 0,
      links: perPulse.get(pulse.id) ?? [],
    }));

    return Response.json({ rounds });
  } catch (error) {
    const status = error instanceof SupabaseError ? error.status : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: status === 503 ? 503 : 500 },
    );
  }
}
