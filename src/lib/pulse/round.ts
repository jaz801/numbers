/**
 * Opening a round: one pulse, one invite per person, one link per invite.
 *
 * Nothing is mailed from here. The links come back as text and go out by hand
 * — that is the whole point of this route: a round can start in the next
 * minute without waiting on DNS, a template or a send window.
 */

import { randomBytes } from "node:crypto";
import { audience } from "@/data/audience";
import { segmentVan } from "@/data/segments";
import type { Invite, MemberType, Person, Pulse, Settings } from "@/lib/db";
import { insert, sb, upsert } from "@/lib/supabase";
import { drawQuestions, questionCount, type PoolQuestion, type PulseKind } from "./questions";

export type RoundLink = {
  person: string;
  email: string;
  segment: MemberType;
  url: string;
  /** The questions this person will see, in the order they will see them. */
  questions: { code: string; theme: string; text: string }[];
};

export type Round = {
  pulseId: string;
  kind: PulseKind;
  label: string;
  /** Open text included, so it matches what the invitation promises. */
  questionCount: number;
  dashboardUrl: string;
  links: RoundLink[];
};

/** 22 url-safe characters — comfortably past the 16 the schema demands. */
function token(): string {
  return randomBytes(16).toString("base64url");
}

/**
 * The demo audience as np_people rows.
 *
 * Upsert on e-mail so opening a second round reuses the same people instead of
 * failing on the unique index.
 */
async function ensurePeople(): Promise<Person[]> {
  return upsert<Person>(
    "np_people",
    audience.map((member) => ({
      name: member.name,
      first_name: member.firstName,
      email: member.email,
      member_type: segmentVan(member.id),
      active: true,
    })),
    "email",
  );
}

async function loadSettings(): Promise<Settings | null> {
  const rows = await sb<Settings[]>("np_settings?select=*&limit=1");
  return rows?.[0] ?? null;
}

async function loadPool(): Promise<PoolQuestion[]> {
  return sb<PoolQuestion[]>(
    "np_questions?select=id,code,theme,text&enabled=eq.true&order=code.asc",
  );
}

/**
 * Create the round and freeze a question set per person.
 *
 * `mode` is stored on the pulse rather than inferred later: a live dashboard
 * that shows individual answers is demo behaviour, and the record of that
 * choice belongs next to the data it produced.
 */
export async function createRound(
  kind: PulseKind,
  label: string,
  baseUrl: string,
  mode: "demo" | "productie" = "demo",
): Promise<Round> {
  const [people, settings, pool] = await Promise.all([
    ensurePeople(),
    loadSettings(),
    loadPool(),
  ]);

  if (pool.length < 12) {
    throw new Error(`De vragenpool heeft maar ${pool.length} actieve vragen; dat is te weinig.`);
  }

  const [pulse] = await insert<Pulse>("np_pulses", [
    {
      label,
      kind,
      status: "verstuurd",
      sent_at: new Date().toISOString(),
      settings: {
        mode,
        kind,
        randomize: true,
        anonymous: settings?.anonymous ?? true,
        threshold_n: settings?.threshold_n ?? 5,
        scored_questions: questionCount(kind) - 1,
      },
    },
  ]);
  if (!pulse) throw new Error("De pulse kon niet worden aangemaakt.");

  const rows = people.map((person) => {
    const invited = token();
    // Seeded on the token, so the link and the frozen ids can never drift apart.
    const questions = drawQuestions(pool, kind, invited);
    return {
      person,
      questions,
      row: {
        pulse_id: pulse.id,
        person_id: person.id,
        token: invited,
        question_ids: questions.map((question) => question.id),
        segment: person.member_type,
        sent_at: new Date().toISOString(),
      },
    };
  });

  await insert<Invite>(
    "np_invites",
    rows.map((row) => row.row),
  );

  const base = baseUrl.replace(/\/$/, "");
  return {
    pulseId: pulse.id,
    kind,
    label,
    questionCount: questionCount(kind),
    dashboardUrl: `${base}/live/${pulse.id}`,
    links: rows.map(({ person, questions, row }) => ({
      person: person.name,
      email: person.email,
      segment: person.member_type,
      url: `${base}/vragen/${row.token}`,
      questions: questions.map((question) => ({
        code: question.code,
        theme: question.theme,
        text: question.text,
      })),
    })),
  };
}
