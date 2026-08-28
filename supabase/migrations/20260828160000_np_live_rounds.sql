-- Live rondes: een pulse kent zijn soort, en elke hercalculatie wordt bewaard
-- als een eigen versie zodat het dashboard kan laten zien wat één antwoord
-- veranderde. Zie docs/data-pipeline-plan.md §6 en §7.

-- 'flits' = 4 gescoorde vragen + 1 open vraag, 'diepte' = 11 + 1.
alter table np_pulses
  add column if not exists kind text not null default 'flits'
    check (kind in ('flits', 'diepte'));

-- Eén rij per hercalculatie. Nooit overschrijven: het spoor ís de demo.
create table if not exists np_insight_versions (
  id           uuid primary key default gen_random_uuid(),
  pulse_id     uuid not null references np_pulses (id) on delete cascade,
  n_responses  int  not null,
  summary      text not null default '',
  insights     jsonb not null default '[]'::jsonb,
  model        text,
  generated_at timestamptz not null default now(),
  unique (pulse_id, n_responses)
);

create index if not exists np_insight_versions_pulse_idx
  on np_insight_versions (pulse_id, n_responses);

-- Reproduceerbaarheid en kosten van elke modelaanroep.
create table if not exists np_llm_runs (
  id                uuid primary key default gen_random_uuid(),
  pulse_id          uuid references np_pulses (id) on delete cascade,
  stage             text not null,
  model             text not null,
  input_hash        text not null,
  valid             boolean not null default false,
  validator_errors  jsonb not null default '[]'::jsonb,
  raw_response      jsonb,
  prompt_tokens     int,
  completion_tokens int,
  cost_usd          numeric,
  latency_ms        int,
  created_at        timestamptz not null default now()
);

create index if not exists np_llm_runs_pulse_idx on np_llm_runs (pulse_id, created_at desc);

alter table np_insight_versions enable row level security;
alter table np_llm_runs         enable row level security;

create policy "np service role full access to insight versions"
  on np_insight_versions for all to service_role using (true) with check (true);
create policy "np service role full access to llm runs"
  on np_llm_runs for all to service_role using (true) with check (true);
