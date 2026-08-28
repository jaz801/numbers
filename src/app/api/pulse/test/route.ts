/**
 * /api/pulse/test — send the pulse invitations to yourself.
 *
 * Exists so a test send can run on Vercel, where MAILEROO_API_KEY already
 * lives: nobody has to copy the key onto a laptop to see the mail land.
 *
 * Two guards, because a route that sends mail on request is a spam relay
 * waiting to happen:
 *  - the secret must match PULSE_TEST_SECRET; without that env var set the
 *    route refuses to do anything at all.
 *  - the recipient must already be in the demo audience. No arbitrary
 *    addresses, whoever holds the secret.
 *
 * POST is the real interface: `x-pulse-secret` header, JSON body. GET does
 * the same with `?secret=&email=&kinds=`, so the test can also be fired from
 * a browser or a tool that only speaks GET. A GET that sends mail is a
 * deliberate compromise for a test route: the secret ends up in access logs
 * and browser history, so rotate PULSE_TEST_SECRET when the test is done and
 * drop this route before anything real depends on it.
 */

import { timingSafeEqual } from "node:crypto";
import { audience } from "@/data/audience";
import { buildDemoMail, type PulseKind } from "@/lib/emails/demo-content";
import { parseAddress, sendMail } from "@/lib/maileroo";

export const runtime = "nodejs";

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type SendInput = { email?: string; kinds?: PulseKind[] };

async function handle(request: Request, provided: string, input: SendInput) {
  const secret = process.env.PULSE_TEST_SECRET;
  const apiKey = process.env.MAILEROO_API_KEY;
  const from = process.env.MAILEROO_FROM;

  if (!secret) {
    return Response.json(
      { error: "PULSE_TEST_SECRET is niet gezet; de route is uitgeschakeld." },
      { status: 503 },
    );
  }

  if (!secretMatches(provided, secret)) {
    return Response.json({ error: "Onjuist of ontbrekend pulse-secret." }, { status: 401 });
  }

  if (!apiKey || !from) {
    return Response.json(
      { error: "MAILEROO_API_KEY of MAILEROO_FROM ontbreekt in de omgeving." },
      { status: 503 },
    );
  }

  const email = (input.email ?? audience[0]!.email).trim().toLowerCase();
  const member = audience.find((person) => person.email.toLowerCase() === email);
  if (!member) {
    return Response.json(
      { error: `${email} staat niet in de demo-audience; testmails gaan alleen daarheen.` },
      { status: 422 },
    );
  }

  const kinds: PulseKind[] = input.kinds?.length ? input.kinds : ["flits", "diepte"];
  const invalid = kinds.filter((kind) => kind !== "flits" && kind !== "diepte");
  if (invalid.length) {
    return Response.json(
      { error: `Onbekende pulse-soort: ${invalid.join(", ")}. Kies flits en/of diepte.` },
      { status: 422 },
    );
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin).replace(/\/$/, "");

  const sent: { kind: PulseKind; subject: string; referenceId?: string }[] = [];
  for (const kind of kinds) {
    const mail = buildDemoMail(kind, member, baseUrl);
    try {
      const result = await sendMail(
        {
          from: parseAddress(from),
          to: [{ address: member.email, display_name: member.name }],
          subject: mail.subject,
          html: mail.html,
          plain: mail.text,
        },
        apiKey,
      );
      sent.push({ kind, subject: mail.subject, referenceId: result.referenceId });
    } catch (error) {
      // Report what did go out, so a half-succeeded run is not a mystery.
      return Response.json(
        { sent, failed: kind, error: error instanceof Error ? error.message : String(error) },
        { status: 502 },
      );
    }
  }

  return Response.json({ to: member.email, sent });
}

export async function POST(request: Request) {
  let body: SendInput = {};
  try {
    body = (await request.json()) as SendInput;
  } catch {
    // An empty body is fine: it falls back to the demo defaults.
  }
  return handle(request, request.headers.get("x-pulse-secret") ?? "", body);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kinds = params
    .get("kinds")
    ?.split(",")
    .map((kind) => kind.trim())
    .filter(Boolean) as PulseKind[] | undefined;

  return handle(request, params.get("secret") ?? "", {
    email: params.get("email") ?? undefined,
    kinds,
  });
}
