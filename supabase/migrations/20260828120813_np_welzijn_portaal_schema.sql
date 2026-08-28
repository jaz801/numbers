-- Numbers Welzijn Portaal (np_) — pulse survey schema.
-- Namespaced with np_ because this Supabase project is shared with other apps.
-- Applied to project wtkgbrwhkwmlqkcfkmqz as 20260828120813.

create type np_member_type as enum ('intern', 'extern');
create type np_question_kind as enum ('kern', 'verdieping');
create type np_pulse_interval as enum ('maandelijks', 'kwartaal');
create type np_pulse_status as enum ('concept', 'verstuurd', 'gesloten');
create type np_urgentie as enum ('laag', 'midden', 'hoog');

-- ---------------------------------------------------------------- deelnemers
create table np_people (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(btrim(name)) > 0),
  first_name   text not null check (length(btrim(first_name)) > 0),
  email        citext not null unique,
  member_type  np_member_type not null default 'intern',
  -- Headshot as a data URL, downscaled to 200x200 in the browser before upload.
  avatar       text check (avatar is null or length(avatar) <= 200000),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------- vragenpool
-- Holds both the 56 seeded questions (is_builtin) and anything added in the UI.
create table np_questions (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (code ~ '^[A-Z]{2,4}[0-9]{2}$'),
  theme      text not null check (length(btrim(theme)) > 0),
  text       text not null check (length(btrim(text)) > 0),
  kind       np_question_kind not null default 'verdieping',
  is_builtin boolean not null default false,
  enabled    boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index np_questions_theme_idx on np_questions (theme, sort_order);
create index np_questions_enabled_idx on np_questions (enabled) where enabled;

-- --------------------------------------------------------------- instellingen
-- Single row, enforced by the id check. Update in place, never insert twice.
create table np_settings (
  id                  boolean primary key default true check (id),
  interval            np_pulse_interval not null default 'maandelijks',
  -- Weekdays the pulse may go out on: 1 = monday … 7 = sunday.
  days                smallint[] not null default '{2}'
                        check (days <@ array[1,2,3,4,5,6,7]::smallint[]),
  randomize           boolean not null default true,
  anonymous           boolean not null default true,
  -- Never show a segment below this many responses. Production value is 5;
  -- the demo lowers it deliberately and says so out loud.
  threshold_n         integer not null default 5 check (threshold_n >= 1),
  core_per_pulse      integer not null default 3 check (core_per_pulse >= 0),
  extra_per_pulse     integer not null default 1 check (extra_per_pulse >= 0),
  next_pulse_on       date,
  updated_at          timestamptz not null default now()
);

insert into np_settings (id) values (true);

-- -------------------------------------------------------------------- pulses
create table np_pulses (
  id        uuid primary key default gen_random_uuid(),
  label     text not null,
  status    np_pulse_status not null default 'concept',
  -- Settings as they were when the pulse went out, so a later change to
  -- np_settings never rewrites the history of a pulse already sent.
  settings  jsonb not null default '{}'::jsonb,
  sent_at   timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create index np_pulses_created_idx on np_pulses (created_at desc);

-- -------------------------------------------------------------- uitnodigingen
-- The token is the identity: no accounts, no login.
create table np_invites (
  id           uuid primary key default gen_random_uuid(),
  pulse_id     uuid not null references np_pulses (id) on delete cascade,
  person_id    uuid not null references np_people (id) on delete cascade,
  token        text not null unique check (length(token) >= 16),
  -- Questions are frozen per invite at send time, so randomisation stays stable.
  question_ids uuid[] not null check (array_length(question_ids, 1) > 0),
  -- Segment copied from the person, so responses stay usable after anonymising.
  segment      np_member_type not null,
  sent_at      timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (pulse_id, person_id)
);

create index np_invites_pulse_idx on np_invites (pulse_id);

-- ---------------------------------------------------------------- antwoorden
-- One row per submission. invite_id is nulled out on an anonymous pulse right
-- after the write; segment survives so the dashboard can still split it.
create table np_responses (
  id         uuid primary key default gen_random_uuid(),
  pulse_id   uuid not null references np_pulses (id) on delete cascade,
  invite_id  uuid unique references np_invites (id) on delete set null,
  segment    np_member_type not null,
  open_text  text,
  created_at timestamptz not null default now()
);

create index np_responses_pulse_idx on np_responses (pulse_id);

-- One row per scored question — normalised so theme averages are plain SQL.
create table np_answers (
  id          uuid primary key default gen_random_uuid(),
  response_id uuid not null references np_responses (id) on delete cascade,
  question_id uuid not null references np_questions (id) on delete restrict,
  score       smallint not null check (score between 1 and 5),
  unique (response_id, question_id)
);

create index np_answers_question_idx on np_answers (question_id);

-- ------------------------------------------------------------- AI-uitkomsten
-- Cached, because a demo that spends five seconds on an API call reads as broken.
create table np_insights (
  pulse_id     uuid primary key references np_pulses (id) on delete cascade,
  summary      text not null,
  -- [{ kop, bewijs, actie, urgentie }]
  insights     jsonb not null default '[]'::jsonb,
  quote        text,
  model        text,
  generated_at timestamptz not null default now()
);

-- ---------------------------------------------------------- dashboard-aanzicht
create view np_theme_scores
with (security_invoker = true) as
  select r.pulse_id,
         q.theme,
         r.segment,
         round(avg(a.score)::numeric, 2) as avg_score,
         count(*)                        as answer_count,
         count(distinct r.id)            as respondent_count
    from np_answers a
    join np_responses r on r.id = a.response_id
    join np_questions q on q.id = a.question_id
   group by r.pulse_id, q.theme, r.segment;

-- ----------------------------------------------------------------------- RLS
-- Everything goes through server routes on the service role; no client reaches
-- these tables directly, so no anon/authenticated policies exist.
alter table np_people    enable row level security;
alter table np_questions enable row level security;
alter table np_settings  enable row level security;
alter table np_pulses    enable row level security;
alter table np_invites   enable row level security;
alter table np_responses enable row level security;
alter table np_answers   enable row level security;
alter table np_insights  enable row level security;

create policy "np service role full access to people"    on np_people    for all to service_role using (true) with check (true);
create policy "np service role full access to questions" on np_questions for all to service_role using (true) with check (true);
create policy "np service role full access to settings"  on np_settings  for all to service_role using (true) with check (true);
create policy "np service role full access to pulses"    on np_pulses    for all to service_role using (true) with check (true);
create policy "np service role full access to invites"   on np_invites   for all to service_role using (true) with check (true);
create policy "np service role full access to responses" on np_responses for all to service_role using (true) with check (true);
create policy "np service role full access to answers"   on np_answers   for all to service_role using (true) with check (true);
create policy "np service role full access to insights"  on np_insights  for all to service_role using (true) with check (true);
