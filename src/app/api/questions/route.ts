/**
 * /api/questions — the question pool.
 *
 * GET returns the whole pool, POST adds the one the settings screen types in.
 * The code is minted here, not in the browser: np_questions requires it to be
 * unique and to match ^[A-Z]{2,4}[0-9]{2}$, so the next free number per theme
 * is a database question, not a UI one.
 */

import { THEMAS } from "@/components/welzijn/data";
import { NpError, npInsert, npSelect } from "@/lib/supabase";
import type { Question } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KOLOMMEN = "id,code,theme,text,kind,is_builtin,enabled,sort_order,created_at";

/** Two digits in the code, so a theme holds 99 questions at most. */
const MAX_PER_THEMA = 99;

/** A duplicate code means someone else inserted between our read and write. */
const POGINGEN = 3;

type Invoer = { tekst?: unknown; thema?: unknown };

function melding(error: unknown) {
  if (error instanceof NpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json(
    { error: error instanceof Error ? error.message : String(error) },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const questions = await npSelect<Question>(
      "np_questions",
      `select=${KOLOMMEN}&order=theme.asc,sort_order.asc`,
    );
    return Response.json({ questions });
  } catch (error) {
    return melding(error);
  }
}

/** The lowest unused number in this theme, so a deleted code gets reused. */
async function volgendeCode(thema: string): Promise<string> {
  const bestaand = await npSelect<{ code: string }>(
    "np_questions",
    `select=code&theme=eq.${encodeURIComponent(thema)}`,
  );
  const bezet = new Set(
    bestaand.map((q) => Number(q.code.slice(thema.length))).filter((n) => !Number.isNaN(n)),
  );
  for (let n = 1; n <= MAX_PER_THEMA; n++) {
    if (!bezet.has(n)) return thema + String(n).padStart(2, "0");
  }
  throw new NpError(`Thema ${thema} zit vol; er passen ${MAX_PER_THEMA} vragen in.`, 409);
}

export async function POST(request: Request) {
  let invoer: Invoer = {};
  try {
    invoer = (await request.json()) as Invoer;
  } catch {
    return Response.json({ error: "Onleesbare aanvraag." }, { status: 400 });
  }

  const tekst = typeof invoer.tekst === "string" ? invoer.tekst.trim() : "";
  const thema = typeof invoer.thema === "string" ? invoer.thema : "";

  if (!tekst) {
    return Response.json({ error: "Typ eerst een vraag." }, { status: 422 });
  }
  if (!THEMAS.some((t) => t.key === thema)) {
    return Response.json({ error: `Onbekend thema: ${thema}.` }, { status: 422 });
  }

  for (let poging = 1; poging <= POGINGEN; poging++) {
    const code = await volgendeCode(thema).catch((error) => error as NpError);
    if (code instanceof NpError) return melding(code);
    try {
      const question = await npInsert<Question>("np_questions", {
        code,
        theme: thema,
        text: tekst,
        kind: "verdieping",
        is_builtin: false,
        enabled: true,
        sort_order: Number(code.slice(thema.length)),
      });
      return Response.json({ question }, { status: 201 });
    } catch (error) {
      const botsing = error instanceof NpError && error.status === 409;
      if (!botsing || poging === POGINGEN) return melding(error);
    }
  }

  return Response.json({ error: "De vraag kon geen vrije code krijgen." }, { status: 409 });
}
