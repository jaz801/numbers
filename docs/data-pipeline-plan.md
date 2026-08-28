# Van antwoorden naar inzicht — pipeline plan

How a pulse round becomes (a) numbers you can track over time and (b) insights
somebody can act on, without the numbers being flattering, the trends being
noise, or the LLM inventing the evidence.

Status: **plan**. Nothing in `src/` implements this yet.

---

## 1. What we are working with

| | |
|---|---|
| Population | Namber — one small bookkeeping firm. Realistically **8–30 medewerkers**, split `intern` / `extern`. |
| Instrument | Flitspulse: 4 scored items + 1 open text, monthly. Dieptepulse: 11 scored items + 1 open text, every 4 months. Scale 1–5. |
| Themes | Werkgeluk, Zingeving, Welzijn, Organisatie. |
| Rotation | `np_settings.randomize` + `core_per_pulse` / `extra_per_pulse`: **each invite freezes its own question set**. Different people get different questions in the same round. |
| Anonymity | `np_settings.anonymous`: `np_responses.invite_id` is nulled right after the write. `segment` survives. |
| Disclosure | `threshold_n` (production 5): never show a cell below it. |
| Special category | `labels` (autisme, adhd, …) is GDPR art. 9 data. Self-declared only. Never inferred, never segmented on, never in a prompt. |
| Dashboard today | `src/app/page.tsx` renders the hard-coded audience. There is no dashboard yet — the view `np_theme_scores` is the only analytical surface that exists. |

Two facts dominate every design decision below:

1. **n is tiny.** With 12 responders, one grumpy Monday moves a theme average by
   0.25. Most "trends" in this data are arithmetic, not organisational.
2. **The question mix changes every round.** `np_theme_scores` averages whatever
   items happened to be drawn. A theme can "drop" purely because a harder item
   came up. Comparing two pulses on that view is comparing two different tests.

Everything that follows exists to stop those two facts from producing confident
nonsense.

---

## 2. Design principles

1. **No LLM ever produces a number.** All quantitative output comes from
   deterministic SQL/TS. The model gets numbers as *input* and may only cite
   them; a validator rejects any figure it cannot resolve.
2. **The model is blind by default.** The open-text coder sees one text, with no
   name, no segment, no scores, no labels, no other answers, no prior insight.
   Nothing that lets it confirm a story.
3. **Signal vs. noise is decided before the model is called.** A change that
   fails the noise test cannot be dressed up as urgent.
4. **Suppression is structural, not editorial.** Cells below `threshold_n` never
   enter the prompt at all, so they cannot leak through a summary.
5. **Everything is reproducible.** Model id, provider, prompt hash, input hash,
   temperature, seed, raw response and cost are stored. Re-running a pulse with
   unchanged inputs returns the cached result.
6. **Honest emptiness beats a manufactured insight.** "Geen betrouwbare
   verandering deze ronde" is a valid, shippable dashboard state.

---

## 3. Layer A — the deterministic quantitative layer

Pure TS + SQL. No network. Fully unit-testable on synthetic data.

### A1. Response rate first
Per pulse, per segment: `responses / invites`. Fully observed, no inference
needed, and the earliest disengagement signal there is. It is the **first tile
on the dashboard**, above any score.

### A2. Item baselines (kills the rotation bias)
For each question `q`, a shrunk historical baseline:

```
b_q = (n_q · mean_q + k · G) / (n_q + k)     k = 20, G = global grand mean
```

Mix-adjusted theme score for pulse `p`, theme `t`:

```
adj(p,t) = G + mean over answers in (p,t) of (score − b_q)
```

This is what gets tracked over time. Raw means are still stored, but never
plotted across pulses — they are not comparable.

### A3. Reporting a level
- **Top-2-box** `% score ∈ {4,5}` and **bottom-2-box** `% ∈ {1,2}`, plus the
  full 1–5 distribution. This is what a manager should read: the mean of an
  ordinal 4-item scale is a convenience, not a measurement.
- Mean, shrunk toward the theme's own history (`k = 8`), reported **with an
  80% interval from a seeded bootstrap** (10k resamples, fixed seed → identical
  output on re-run). No normality assumption, no t-test theatre.

### A4. Reporting a change
Only within the same items, and paired where possible:

```
Δ(t) = adj(p,t) − adj(p−1,t)   restricted to items asked in both rounds
```

A change is labelled **`signaal`** only if all three hold:
- the 80% bootstrap CI on Δ excludes 0, **and**
- `|Δ| ≥ 0.3`, **and**
- `n ≥ threshold_n` in both rounds.

Otherwise: **`ruis`**. `ruis` may be shown, but can never carry
`urgentie: hoog`. This single rule is what stops the product from generating a
monthly panic.

### A5. Response-style correction
Within a response, centre on that respondent's own mean for that round:
`c_ri = score_ri − mean_r`. The theme profile of centred scores answers "what is
relatively low for people, whoever they are" and is immune to the
always-a-4 / never-above-3 styles. Valid because every response carries ≥ 4
scored items. Shown as a second view, never mixed with the absolute one.

### A6. Non-response bounds
Recompute Δ under the assumption that non-responders sit one point below the
responder mean. If the sign flips, the finding is tagged `fragiel` and its
urgency is capped. Reported as a caveat, never used to silently kill a finding.

### A7. Segments
Only `intern` / `extern`, only above `threshold_n`, never `labels`. If one
segment is below threshold, the split is not rendered *and* not computed — a
suppressed cell that still exists in memory is a leak waiting for a bug.

All of A lands in a materialised `np_metrics` table with a stable `stat_id` per
row. That id is the only thing an insight is allowed to cite.

---

## 4. Layer B — open text, coded (OpenRouter)

One call per open text. Input: the text alone. Output (strict json_schema):

```json
{ "themes": [{ "code": "WERKDRUK", "span": "<verbatim substring>",
               "polarity": -1, "confidence": 0.0 }],
  "bevat_persoonsgegevens": true,
  "signaal": "geen" }        // geen | zorg | integriteit
```

- Codes come from a **fixed taxonomy** (~18 codes under the 4 themes + `overig`).
  A free-form theme list would drift every month and destroy comparability.
- `span` must be an **exact substring** of the input. Verified in code. Any
  miss → one retry → then parked for human review. This is the cheapest
  hallucination guard available.
- `bevat_persoonsgegevens` gates whether the text may ever be quoted.
- `signaal: zorg | integriteit` is routed **out** of the aggregate to the pulse
  owner as a single confidential notice, exactly as the mail promises. It never
  becomes a dashboard insight, and — because the round is anonymous — it comes
  with the honest note that the sender cannot be contacted directly.

Code counts below `threshold_n` are not reported and not passed on.

---

## 5. Layer C — insights, grounded and checked

**Input:** the `np_metrics` rows (with `stat_id`, `signaal|ruis|fragiel`), the
above-threshold code counts, the response rate, and the log of actions promised
in previous rounds. **Not** the raw texts, **not** names, **not** labels.

**Output:** 3–5 items matching the existing `np_insights` shape
(`{ kop, bewijs, actie, urgentie }`) plus a `stat_id`.

**Validator (deterministic, TS):**
- every numeral in `bewijs` must resolve to a value in the input stats;
- `stat_id` must exist and must not be a suppressed cell;
- `urgentie` capped by evidence class: `ruis` → max `laag`, `fragiel` → max
  `midden`;
- an insight about a theme with no `signaal` row is rejected.

One repair round with the validator error appended; then dropped.

**Critic pass:** a second, cheap call whose only job is to argue the insight is
noise, given the same stats. Returns `{ houdbaar, reden }`. Only survivors are
stored. Rejected insights are kept in the audit table — the pattern of what gets
rejected is itself worth reading.

**Quotes:** one verbatim, only if the round has `≥ threshold_n` responses, only
from a text with `bevat_persoonsgegevens: false`, and only after a
re-identification check (does it name a role, a client, a date?). At n = 12 in
one office, "de nieuwe collega bij debiteuren" is a name.

---

## 6. Schema additions

```sql
-- Reproducibility + cost audit for every model call.
create table np_llm_runs (
  id uuid primary key default gen_random_uuid(),
  pulse_id uuid references np_pulses(id) on delete cascade,
  stage text not null,              -- 'coder' | 'synth' | 'critic'
  model text not null, provider text,
  prompt_hash text not null, input_hash text not null,
  temperature numeric, seed integer,
  raw_response jsonb, valid boolean not null,
  validator_errors jsonb default '[]'::jsonb,
  prompt_tokens int, completion_tokens int, cost_usd numeric,
  latency_ms int, created_at timestamptz not null default now(),
  unique (stage, prompt_hash, input_hash)   -- idempotency key
);

-- Materialised Layer A output. The only thing an insight may cite.
create table np_metrics (
  stat_id text primary key,         -- e.g. 'p:<uuid>|t:welzijn|s:intern|m:adj'
  pulse_id uuid not null references np_pulses(id) on delete cascade,
  theme text, question_id uuid, segment np_member_type,
  metric text not null,             -- adj | raw | top2 | bottom2 | delta | response_rate
  value numeric not null, ci_low numeric, ci_high numeric,
  n int not null, evidence text not null,   -- signaal | ruis | fragiel
  computed_at timestamptz not null default now()
);

create table np_open_codes (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references np_responses(id) on delete cascade,
  code text not null, span text not null, polarity smallint not null,
  confidence numeric, run_id uuid references np_llm_runs(id)
);

-- Annotate known load peaks so the kwartaalafsluiting dip is not "an insight".
create table np_events (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null, label text not null, kind text not null
);

-- Closes the loop the invitation mail already promises.
create table np_actions (
  id uuid primary key default gen_random_uuid(),
  pulse_id uuid references np_pulses(id),
  theme text, belofte text not null, status text not null default 'open',
  effect_stat_id text, created_at timestamptz not null default now()
);
```

Plus two changes to existing tables:

- `np_settings.anchor_question_ids uuid[]` — items asked **every** round (see
  critique #4).
- `np_responses.respondent_hash text` — `hmac(person_id, server secret)`,
  written instead of `invite_id` on an anonymous round (see critique #6).

---

## 7. Code layout and run order

```
src/lib/openrouter.ts        minimal client, same spirit as maileroo.ts
src/lib/pipeline/stats.ts    Layer A — pure functions, no I/O
src/lib/pipeline/code.ts     Layer B — coder + span validator
src/lib/pipeline/insights.ts Layer C — synth + validator + critic
src/lib/pipeline/run.ts      orchestration, stage-by-stage, idempotent
src/app/api/pulse/[id]/process/route.ts   secret-guarded trigger (Vercel cron)
```

Stages run in order and each writes its own state, so a failure resumes rather
than restarts:
`close pulse → A (stats) → B (code texts) → C (synth) → validate → critic → write np_insights`.

At this data volume the whole run is seconds and a handful of cents. No queue,
no worker — a cron-triggered route is the right size.

### OpenRouter specifics
- `OPENROUTER_API_KEY`, models pinned per stage in env
  (`OPENROUTER_MODEL_CODER` / `_SYNTH` / `_CRITIC`) — never "latest".
- Current pick for all three stages: **`gpt-5.6-terra`** with
  `reasoning: { effort: "medium" }`. Enough for coding one Dutch sentence and
  for weighing a stats table, without paying high-effort latency on a job that
  runs a dozen times a month. Verify the exact slug against OpenRouter's model
  list before wiring it up.
- Reasoning effort is part of the pinned identity: it is stored in
  `np_llm_runs` next to the model id, and changing it re-triggers the golden
  set exactly as a model swap does (#10).
- `temperature: 0`, `response_format: { type: "json_schema", strict: true }`.
- `provider: { require_parameters: true, allow_fallbacks: false, data_collection: "deny" }`
  — a silent fallback to a provider that ignores the schema, or that retains
  prompts, is the failure mode that matters here.
- `usage: { include: true }` → cost straight into `np_llm_runs`.
- Hard cost cap per pulse; exceeding it aborts the stage and leaves the
  deterministic numbers standing on their own.
- The existing `ANTHROPIC_API_KEY` line in `.env.example` is replaced.

---

## 8. Criticism from a data analyst

Read this as a hostile review of section 3–7. Each point ends with what changes.

**1. Your confidence intervals will swallow the whole scale.**
At n = 12 with a 4-item pulse, an 80% CI on a theme mean is roughly ±0.4 — wider
than any effect worth acting on. Nearly everything will be `ruis`, and a
dashboard that says "geen betrouwbare verandering" five months running gets
switched off. → **Stop selling this as measurement.** Frame it as
*gespreksagenda*: the numbers rank what to talk about this month, they do not
prove anything. Rank themes by "lowest, with the distribution shown"; reserve
the trend line for anchor items only. Say the n out loud on every tile.

**2. Item baselines need history you do not have.**
`b_q` with `k = 20` is a fine estimator on round 15 and a coin flip on round 2.
For the first ~4 rounds the mix adjustment adds a pseudo-precise correction on
top of noise. → Cold-start rule: **no mix adjustment and no trend line until an
item has ≥ 3 observations across ≥ 2 rounds.** Until then, show levels and
distributions only.

**3. Self-consistency and a critic pass are overkill at this volume.**
Three-vote coding on twelve open texts triples cost and latency to disambiguate
text a human reads in ninety seconds. → Drop self-consistency. **Below ~15 open
texts, the LLM proposes and a human confirms in the UI**; the model earns
autonomy when the corpus is big enough for the human review to be the
bottleneck. Keep the critic pass — it is one cheap call and it is the thing
keeping urgency honest.

**4. Randomisation is the single biggest thing hurting you, and it is a
setting, not a statistic.**
`randomize: true` with a rotating question set means you are running a slightly
different survey every month and then trying to correct for it downstream. No
amount of shrinkage buys back the power you threw away at send time.
→ **Fix a 4-item anchor set asked every single round** (one per theme, chosen
for spread), rotate only the verdieping items. This is one schema field
(`anchor_question_ids`) and one change in the send logic, and it does more for
trend quality than all of section 3 combined. It is the highest-leverage item
in this document.

**5. You are averaging ordinal data and you know it.**
Mean of a 1–5 Likert assumes the gap 1→2 equals 4→5. It does not, and at n = 12
the mean is dragged by single responses. → Top-2-box and the full distribution
become the **primary** reported figures; the mean is demoted to a secondary
number for the trend line only, where its bias is at least constant.

**6. Anonymity as implemented destroys your panel — and the proposed fix is a
re-identification risk.**
Nulling `invite_id` means every round is a fresh cross-section: you can never
tell "the team dipped" from "different people answered". `respondent_hash`
restores paired comparisons and roughly halves the variance on Δ. But in a
12-person office, a stable pseudonym plus segment plus round is close to
identifying. → Ship the hash **only if**: it never leaves the server, it is
never exposed in any API response or dashboard cell, it is used solely inside
aggregate computation, the HMAC secret is rotated per pulse *series* (not per
round), and it is written into the AVG register and the invitation copy. If any
of those cannot be guaranteed, **drop the hash and accept the wider intervals**
— the promise in the mail outranks the statistics.

**7. Manski bounds will be too wide to be useful.**
At a 60% response rate the worst-case bound covers almost any conclusion. Used
as a gate it suppresses everything. → Keep it as a **displayed caveat with the
response rate**, not as a filter. Already the intent in A6; make sure the
implementation cannot quietly drop findings.

**8. Thematic coding of three sentences is not analysis.**
At the demo's n = 3, an LLM summary of the open text strictly adds
hallucination risk over showing the three sentences. → **Hard floor: no
aggregate coding below `threshold_n` open texts.** Below it, the dashboard shows
verbatims (privacy-gated) and nothing else. The demo will hit this floor —
that is correct behaviour, and worth saying out loud in the pitch rather than
faking depth.

**9. Seasonality will be your loudest fake insight.**
Namber's own mail already names the pattern: werkdruk peaks around the
kwartaalafsluiting. Without an event log, every quarter-close round generates a
confident "werkdruk verslechtert". → `np_events` is not optional, and the
comparison for a themed item should prefer **same-phase-last-cycle** over
last-round once ≥ 4 rounds of history exist.

**10. Model drift will silently rewrite your history.**
Swap the coder model and last year's codes are no longer comparable to this
year's — and nothing in the data will tell you. → **Golden set**: 30 fixed
Dutch open texts with human labels, committed to the repo. Re-run on any model
or prompt change; report agreement (Cohen's κ); block the change below κ 0.7.
Store the model id on every code row so a re-code can be scoped.

**11. You are not measuring the only outcome that matters.**
Both mails promise "wat er met de vorige ronde is gebeurd". Nothing in the
schema records what was promised or whether it worked. That loop — belofte →
actie → did the related item move — is the product. Without it this is another
survey tool with a nicer dashboard. → `np_actions`, and an explicit dashboard
block: *beloofd / gedaan / effect op stat X*. Deliberately low-tech: a human
writes the belofte, the pipeline only watches the linked stat.

**12. A rendering bug in the mail is corrupting the instrument.**
The pulse emails in `src/lib/emails/pulse.ts` list the questions **hard-coded**,
while `np_invites.question_ids` freezes a randomised set per person. The moment
randomisation is on, people read one set of questions in the inbox and answer
another in the form. That is not a display bug, it is a priming and validity
bug — and it silently poisons the data before any of this pipeline runs.
→ Render the invitation body **from the invite's frozen `question_ids`** before
the first real round.

**13. Compliance is part of the pipeline, not a footnote.**
Employee welzijn data leaving the EU through an OpenRouter provider you did not
choose, for an employer whose own brand promise is *"een systeem werkt voor
mensen"*, is the kind of detail that ends a pilot. → Provider allowlist,
`data_collection: "deny"`, EU-region preference where available, the processor
chain written into the AVG register, and `labels` structurally unable to reach
`src/lib/pipeline/**` (enforced by a lint rule, not by discipline).

---

## 9. The plan, after the critique

Phased, and reordered so the cheap high-leverage fixes land first.

**Phase 0 — instrument fixes (largest payoff, least code)**
1. `anchor_question_ids` in `np_settings` + send logic uses it (#4).
2. Invitation mail renders from the invite's frozen questions (#12).
3. `np_events`, `np_actions` (#9, #11).
4. Decision on `respondent_hash` — ship-with-guarantees or drop (#6).

**Phase 1 — Layer A, deterministic**
`src/lib/pipeline/stats.ts` + `np_metrics`. Response rate, distributions,
top-2-box, shrunk means with seeded bootstrap CIs, `signaal|ruis|fragiel`
classification, cold-start guard (#2), non-response caveat (#7). Unit tests on
synthetic data, including "12 people, no real change" → must yield zero
`signaal`.

**Phase 2 — dashboard on Layer A alone**
Replace the audience list in `src/app/page.tsx` with: response rate first, n on
every tile, distributions rather than means, trend line for anchor items only,
`ruis` badges, verbatims below the threshold gate, and the beloofd/gedaan/effect
block. **This is shippable and useful with no LLM in it at all** — and it is the
honest fallback if the model layer ever has to be switched off.

**Phase 3 — Layer B, coding**
`openrouter.ts` + coder + span validator + `np_llm_runs` + golden set (#10).
Human-in-the-loop confirmation while the corpus is small (#3). Hard floor at
`threshold_n` texts (#8).

**Phase 4 — Layer C, insights**
Synthesis + validator + critic, writing the existing `np_insights` shape so the
dashboard needs no change to adopt it. Cost cap, full audit trail.

**Phase 5 — hardening**
Drift re-runs on model change, same-phase-last-cycle comparison, AVG register
entry, lint rule blocking `labels` from the pipeline (#13).

### Open questions
- Real headcount and expected response rate. Everything above is calibrated for
  ~12; at 40 the thresholds and the human-in-the-loop stage change.
- `respondent_hash`: ship or drop? A product/privacy call, not a technical one.
- Who is the pulse owner receiving `signaal: zorg` notices, and what is the
  agreed follow-up when the round is anonymous?
- Which four anchor items — that choice fixes what this product can measure for
  the next two years.
