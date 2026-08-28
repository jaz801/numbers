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
import { SupabaseError } from "@/lib/supabase";

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
