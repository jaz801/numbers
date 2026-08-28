/**
 * /api/people — the werknemers of the pulse.
 *
 * GET returns everyone still active, POST adds the person the portal's
 * "Werknemer toevoegen" form describes. Both run on the service role, because
 * np_people carries no policy for anon or authenticated.
 */

import { labelsVoorContext, isContext } from "@/lib/np/context";
import { NpError, npInsert, npSelect } from "@/lib/supabase";
import type { Person } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KOLOMMEN = "id,name,first_name,email,member_type,avatar,labels,active,created_at";

/** The avatar column caps at 200000 characters; say so before Postgres does. */
const MAX_AVATAR = 200000;

type Invoer = {
  naam?: unknown;
  email?: unknown;
  type?: unknown;
  foto?: unknown;
  context?: unknown;
};

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
    const people = await npSelect<Person>(
      "np_people",
      `select=${KOLOMMEN}&active=is.true&order=created_at.asc`,
    );
    return Response.json({ people });
  } catch (error) {
    return melding(error);
  }
}

export async function POST(request: Request) {
  let invoer: Invoer = {};
  try {
    invoer = (await request.json()) as Invoer;
  } catch {
    return Response.json({ error: "Onleesbare aanvraag." }, { status: 400 });
  }

  const naam = typeof invoer.naam === "string" ? invoer.naam.trim() : "";
  const email = typeof invoer.email === "string" ? invoer.email.trim().toLowerCase() : "";
  const type = invoer.type === "extern" ? "extern" : "intern";
  const foto = typeof invoer.foto === "string" && invoer.foto ? invoer.foto : null;
  const context = typeof invoer.context === "string" ? invoer.context : "geen";

  // Same rule as the form itself, so a bypassed browser check lands here.
  if (!naam || !email.includes("@")) {
    return Response.json(
      { error: "Vul een naam en een geldig e-mailadres in." },
      { status: 422 },
    );
  }
  if (foto && foto.length > MAX_AVATAR) {
    return Response.json(
      { error: "De foto is te groot; kies een kleiner beeld." },
      { status: 413 },
    );
  }
  if (!isContext(context)) {
    return Response.json({ error: `Onbekende context: ${context}.` }, { status: 422 });
  }

  try {
    const person = await npInsert<Person>("np_people", {
      name: naam,
      first_name: naam.split(" ")[0],
      email,
      member_type: type,
      avatar: foto,
      labels: labelsVoorContext(context),
    });
    return Response.json({ person }, { status: 201 });
  } catch (error) {
    if (error instanceof NpError && error.status === 409) {
      return Response.json(
        { error: `${email} staat al in de lijst.` },
        { status: 409 },
      );
    }
    return melding(error);
  }
}
