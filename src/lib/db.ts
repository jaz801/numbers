/**
 * Row types for the np_ tables in Supabase.
 *
 * Hand-written and scoped to this app on purpose: the Supabase project is
 * shared with other apps, and their tables have nothing to do with us.
 */

export type MemberType = "intern" | "extern";
export type QuestionKind = "kern" | "verdieping";
export type PulseInterval = "maandelijks" | "kwartaal";
export type PulseStatus = "concept" | "verstuurd" | "gesloten";
export type Urgentie = "laag" | "midden" | "hoog";

export type Person = {
  id: string;
  name: string;
  first_name: string;
  email: string;
  member_type: MemberType;
  /** Headshot as a data URL, downscaled to 200x200 before upload. */
  avatar: string | null;
  active: boolean;
  created_at: string;
};

export type Question = {
  id: string;
  /** Stable code like "WG07", also what the pitch refers to. */
  code: string;
  theme: string;
  text: string;
  kind: QuestionKind;
  is_builtin: boolean;
  enabled: boolean;
  sort_order: number;
  created_at: string;
};

export type Settings = {
  id: true;
  interval: PulseInterval;
  /** 1 = monday … 7 = sunday. */
  days: number[];
  randomize: boolean;
  anonymous: boolean;
  /** Never show a segment below this many responses. Production value is 5. */
  threshold_n: number;
  core_per_pulse: number;
  extra_per_pulse: number;
  next_pulse_on: string | null;
  updated_at: string;
};

export type Pulse = {
  id: string;
  label: string;
  status: PulseStatus;
  /** Settings frozen at send time, so history stays truthful. */
  settings: Record<string, unknown>;
  sent_at: string | null;
  closed_at: string | null;
  created_at: string;
};

export type Invite = {
  id: string;
  pulse_id: string;
  person_id: string;
  /** The token is the identity — there are no accounts. */
  token: string;
  question_ids: string[];
  segment: MemberType;
  sent_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Response = {
  id: string;
  pulse_id: string;
  /** Nulled right after the write on an anonymous pulse. */
  invite_id: string | null;
  segment: MemberType;
  open_text: string | null;
  created_at: string;
};

export type Answer = {
  id: string;
  response_id: string;
  question_id: string;
  /** 1..5. */
  score: number;
};

export type Insight = {
  kop: string;
  bewijs: string;
  actie: string;
  urgentie: Urgentie;
};

export type PulseInsights = {
  pulse_id: string;
  summary: string;
  insights: Insight[];
  quote: string | null;
  model: string | null;
  generated_at: string;
};

/** One row per theme per segment, from the np_theme_scores view. */
export type ThemeScore = {
  pulse_id: string;
  theme: string;
  segment: MemberType;
  avg_score: number;
  answer_count: number;
  respondent_count: number;
};
