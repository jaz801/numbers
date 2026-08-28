/**
 * GET /api/pulse/[id]/state — everything the live dashboard renders.
 *
 * Polled every three seconds. Layer A is recomputed on every call (pure
 * functions over a handful of rows), the insight layer is not: it is cached per
 * number of answers, so a poll on an unchanged round costs one database read
 * and no model call.
 */

import { loadState } from "@/lib/pulse/state";
import { generateInsightsOnce } from "@/lib/pulse/insights";
import { SupabaseError } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const state = await loadState(id);
    if (!state) return Response.json({ error: "Deze ronde bestaat niet." }, { status: 404 });

    // Normally the submit already generated this; this call is the safety net
    // for a submit whose recompute failed, and a no-op the rest of the time.
    const generated = await generateInsightsOnce(state);
    const current =
      generated.version ??
      state.versions.find((version) => version.n_responses === state.stats.responded) ??
      null;

    return Response.json(
      { ...state, current, note: generated.note ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof SupabaseError ? error.status : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status },
    );
  }
}
