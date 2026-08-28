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

**At prototype scale, report counts.** With four or five responses, "75%" is a
lie of precision — it is three people. Below `threshold_n` the dashboard says
*"3 van de 4 gaven een 4 of 5"* and shows the four dots. Percentages, means and
intervals switch on when n crosses the threshold; the same computation, a
different rendering.
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

## 4. Layer B — the read call (OpenRouter)

**One call per pulse, not one per response.** At 4–5 responses a fan-out costs
five round trips to interpret what fits on half a screen. The whole round's open
texts go into a single call.

Two prompt/schema variants, because the two instruments are not the same object:

| | `flits` | `diepte` |
|---|---|---|
| Input | 4 scored items + 1 open text per person | 11 scored items + 1 open text per person |
| Themes covered | whatever was drawn | all four |
| Insight ceiling | 2 | 4 |
| Cross-theme claims | not allowed | allowed |

What the call receives: the open texts, in a seeded shuffle, each with a local
index. **Not** the scores, not names, not segment, not labels, not prior
insights. Withholding the scores is the point — a model that sees a 2 next to a
sentence will find the sentence negative.

Output per text (strict json_schema):

```json
{ "codes": [{ "i": 0, "code": "WERKDRUK", "span": "<verbatim substring>",
              "polarity": -1 }],
  "bevat_persoonsgegevens": [true, false, ...],
  "signaal": [{ "i": 2, "type": "zorg" }] }
```

- Codes come from a **fixed taxonomy** of ~18 entries. Free-form themes would
  drift every month and destroy comparability.
- Every `span` must be an exact substring of **the text at index `i`**, not of
  the batch. Verified in code. Batching makes cross-attribution a real failure
  mode — this check is what catches it. Any miss retries once, then parks the
  round for human review.
- `signaal: zorg | integriteit` routes **out** of the aggregate to the pulse
  owner as one confidential notice, exactly as the mail promises — never a
  dashboard card, and with the honest note that an anonymous sender cannot be
  contacted back.

## 5. Layer C — the insight call

The second and last call. **Input:** the `np_metrics` rows with their evidence
class, the code counts, the response rate, and what was promised in previous
rounds. Plus the verbatims that passed the privacy gate — at this size the
model may as well see the five sentences it already coded. **Not** names, not
labels, not suppressed cells.

**Output:** two to four items in the shape `np_insights` already stores —
`{ kop, bewijs, actie, urgentie }` — plus the `stat_id` the claim rests on.

**Validator (deterministic, TS):**
- every numeral in `bewijs` must resolve to a value in the input stats;
- `stat_id` must exist and must not be a suppressed cell;
- `urgentie` capped by evidence class: `ruis` → max `laag`, `fragiel` → max
  `midden`;
- at `n < threshold_n` the cap is `laag` for everything, full stop.

One repair round with the validator error appended; then dropped.

**No separate critic call in the prototype.** It was there to stop urgency
inflation, and at this n the deterministic gate already does that — with four
responses nothing can reach `signaal`, so nothing can be urgent. The critic
comes back when volume makes the gate loose enough to need it.

**Quotes** stay gated: only above `threshold_n` responses, only from a text
flagged free of personal data, and only after a re-identification check. In one
office of twelve, "de nieuwe collega bij debiteuren" is a name.

### What this costs
Two calls per round. Not two per response, not two per theme — two.
---

## 6. Live tijdens de ronde (MVP)

The dashboard updates as each person submits, and the answers that come in are
shown, so it is visible that this is real and now — not a nightly batch.

### What fires when
On every submit:
1. **Layer A recomputes immediately.** Pure functions over a handful of rows —
   sub-millisecond, no reason to defer it.
2. **The two calls re-fire, debounced ~2 s**, so three people submitting in one
   minute cost one re-read, not three. Five responses over a round is at most
   ~10 model calls; at this size that is cents.
3. The new insight set is written as a **new version**, not an overwrite.

### The version trail is the demo
`np_insight_versions (pulse_id, n_responses, insights, generated_at)` — one row
per recompute. The dashboard shows the current insight card plus what changed
since the previous response landed:

> **na antwoord 3 van 4** · "Werkdruk piekt" → urgentie `midden` → `laag`
> · one insight dropped, evidence no longer held

Two things fall out of this, and the second is the more valuable:

- It makes "real-time" legible instead of merely flickering. A number that
  changes is noise; a number that changes *with a reason attached* is a product.
- **It demonstrates the noise gate rather than explaining it.** Watching an
  insight swing hard between n = 2 and n = 3 is the most persuasive possible
  argument for why n = 4 cannot carry an urgent conclusion. Do not hide the
  swing — narrate it.

### The showcase feed
A `binnengekomen` column: each response appears the moment it lands, with its
timestamp, its scores as a row of dots, and its open text. That is the "this is
live" signal, and it is stronger than a spinner or a pulsing dot because it is
actual content.

### Transport
Poll `/api/pulse/[id]/state` every 3 s from the dashboard. No websocket, no
`supabase-js` dependency — the app has none today and this does not earn one.
The endpoint returns Layer A output, the current insight version, the version
trail, and the feed. Swap to Supabase Realtime later if a round ever gets big
enough for polling to matter.

### The mode switch
Live-plus-showcase is **demo behaviour, and the UI must say so.** One explicit
setting, rendered on screen, never inferred:

| | `demo` | `productie` |
|---|---|---|
| Updates | live, per response | on pulse close |
| Feed | full answers shown | not rendered |
| `threshold_n` | off | enforced |
| Data | the consenting demo audience, or seeded synthetic responses | real medewerkers |

The banner reads, in plain Dutch: *"Demoweergave — drempel uit, losse antwoorden
zichtbaar. Niet gebruiken bij een echte ronde."* A demo mode that looks like the
product is how a threshold gets quietly disabled in production six months later.

## 7. Schema additions

```sql
-- Reproducibility + cost audit for every model call.
create table np_llm_runs (
  id uuid primary key default gen_random_uuid(),
  pulse_id uuid references np_pulses(id) on delete cascade,
  stage text not null,              -- 'read' | 'insight'
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

-- One row per recompute, so the dashboard can show what a single answer changed.
create table np_insight_versions (
  id uuid primary key default gen_random_uuid(),
  pulse_id uuid not null references np_pulses(id) on delete cascade,
  n_responses int not null,
  insights jsonb not null,
  generated_at timestamptz not null default now(),
  unique (pulse_id, n_responses)
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

## 8. Code layout and run order

```
src/lib/openrouter.ts        minimal client, same spirit as maileroo.ts
src/lib/pipeline/stats.ts    Layer A — pure functions, no I/O
src/lib/pipeline/read.ts     Layer B — one call per pulse + span validator
src/lib/pipeline/insights.ts Layer C — one call + validator
src/lib/pipeline/run.ts      orchestration, stage-by-stage, idempotent
src/app/api/pulse/[id]/process/route.ts   secret-guarded trigger (Vercel cron)
```

Stages run in order and each writes its own state, so a failure resumes rather
than restarts:
`close pulse → A (stats) → B (read, 1 call) → C (insight, 1 call) → validate → write np_insights`.

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

## 9. Criticism from a data analyst

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

**3. Two calls is right, and it costs you the blindness principle. Say so.**
Fanning out per response, self-consistency voting and a separate critic call are
all overkill on five sentences — that is settled, and §4–5 now describe one read
call and one insight call. But batching means the coder sees all five texts
together, so response C can colour how it reads response A: a halo the per-text
design did not have. → **Accept it, and pay down what is cheap to pay down**:
seeded shuffle so the order is not the submission order, scores withheld from
the read call, spans validated against their own text rather than the batch, and
**a human confirms the codes before they are published** while the corpus is
this small. The model earns autonomy when human review becomes the bottleneck,
not before.

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

**8. Coding five sentences is not analysis, and the prototype is at five.**
At n = 4–5, an LLM summary of the open text strictly adds hallucination risk
over showing the sentences. Worse, at that size *every* aggregate is
identifying: four people means a theme split is a name. → **Hard floor stands:
no aggregate coding or segment split below `threshold_n`.** Below it the
dashboard shows privacy-gated verbatims, counts out of n, and nothing else. The
prototype sits on the wrong side of this floor by design — which makes it an
honest test of the machinery, not a demo of insight. **Do not lower
`threshold_n` to make the demo look fuller.** If the demo needs to show the
insight layer, run it on seeded synthetic responses and label them as such on
screen.

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

**14. Live updating plus a visible answer feed is a de-anonymiser, and it is
the feature you just asked for.**
In a four-person round, watching the dashboard move when one person submits
tells you what that person answered — you diff the before and after. The
showcase feed is worse: a card appearing at 14:03 is attributable by anyone who
knows who was at their desk. This is not a threshold problem that a higher `n`
fixes; it is inherent to rendering a round *while it is open*. → Fine for an MVP
whose respondents are the three people building it, and unusable as-is with real
medewerkers. Two hard rules so the MVP does not become production by accident:
**the mode switch above is explicit and on screen**, and in `productie` the
dashboard renders nothing at all until the pulse is closed and `threshold_n` is
met. If a live view is genuinely wanted in production later, the only honest
version is a response *counter* — "4 van de 12 binnen" — with no scores, no
texts and no insights until close.

**13. Compliance is part of the pipeline, not a footnote.**
Employee welzijn data leaving the EU through an OpenRouter provider you did not
choose, for an employer whose own brand promise is *"een systeem werkt voor
mensen"*, is the kind of detail that ends a pilot. → Provider allowlist,
`data_collection: "deny"`, EU-region preference where available, the processor
chain written into the AVG register, and `labels` structurally unable to reach
`src/lib/pipeline/**` (enforced by a lint rule, not by discipline).

---

## 10. The plan, after the critique

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

**Phase 2 — the live dashboard**
Replace the audience list in `src/app/page.tsx` with: response rate first, n on
every tile, counts rather than percentages below threshold, distributions rather
than means, `ruis` badges, and the beloofd/gedaan/effect block. Then the live
half — the `binnengekomen` feed, 3 s polling on `/api/pulse/[id]/state`, and the
version trail showing what each new answer changed. **The Layer A half is
shippable and useful with no LLM in it at all** — and it is the honest fallback
if the model layer ever has to be switched off. The mode switch (#14) ships in
this phase, not later.

**Phase 3 — the two calls**
`openrouter.ts`, the read call (both `flits` and `diepte` variants), the span
validator, the insight call, the evidence validator, `np_llm_runs`, golden set
(#10). Human confirmation of codes while the corpus is small (#3), hard floor at
`threshold_n` (#8), cost cap, full audit trail. Writing the existing
`np_insights` shape so the dashboard needs no change to adopt it.

**Phase 4 — hardening**
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
