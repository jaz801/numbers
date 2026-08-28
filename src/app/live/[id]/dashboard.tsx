"use client";

/**
 * Live dashboard for one pulse round.
 *
 * The honesty rules of docs/data-pipeline-plan.md §6 and §9 are enforced here,
 * in the render: below `threshold_n` only counts are shown (§9.8), and in
 * `productie` nothing but the counter exists until the round is closed (§9.14).
 * Every word on screen comes from the data — this file never writes a finding.
 */

import { useEffect, useRef, useState } from "react";
import { THEMAS } from "@/components/welzijn/data";
import type { FeedItem, InsightItem, InsightVersion, RoundState } from "@/lib/pulse/state";
import type { ThemeStat } from "@/lib/pulse/stats";

type LiveState = RoundState & { current: InsightVersion | null; note: string | null };

const POLL_MS = 3000;
const FLASH_MS = 2600;

const THEME_BY_KEY = new Map(THEMAS.map((thema) => [thema.key, thema]));

const URGENTIE: Record<InsightItem["urgentie"], string> = {
  laag: "border-[#27CFC3] bg-[#27CFC3]/20 text-[#00706b]",
  midden: "border-[#F5A46C] bg-[#F5A46C]/25 text-[#8a4b16]",
  hoog: "border-[#1F1F1F] bg-[#1F1F1F] text-white",
};

export default function LiveDashboard({ id }: { id: string }) {
  const [state, setState] = useState<LiveState | null>(null);
  const [hapert, setHapert] = useState(false);
  const [flash, setFlash] = useState<Set<string>>(() => new Set());
  const previous = useRef<LiveState | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      // A slow poll must not queue a second one behind it.
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const response = await fetch(`/api/pulse/${id}/state`, { cache: "no-store" });
        if (!response.ok) throw new Error(`status ${response.status}`);
        const next = (await response.json()) as LiveState;
        if (cancelled) return;
        const changed = changedKeys(previous.current, next);
        previous.current = next;
        setState(next);
        setHapert(false);
        if (changed.size) setFlash(changed);
      } catch {
        // Keep the last good round on screen; only say the line went quiet.
        if (!cancelled) setHapert(true);
      } finally {
        inFlight.current = false;
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id]);

  useEffect(() => {
    if (flash.size === 0) return;
    const timer = setTimeout(() => setFlash(new Set()), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  if (!state) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-sm text-[#5b5b5b]">
        {hapert ? "Deze ronde is nu niet te laden." : "Bezig met laden…"}
      </main>
    );
  }

  const { stats } = state;
  const gesloten = state.status === "gesloten" || state.status === "closed";
  const alleenTeller = state.mode === "productie" && !gesloten;
  const trail = state.versions;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">{state.label}</h1>
          <span className="font-[family-name:var(--font-plex-mono)] text-xs uppercase tracking-wide text-[#5b5b5b]">
            {state.kind} · {state.status} · {state.mode}
          </span>
        </div>
        {hapert ? (
          <p className="mt-2 text-xs text-[#8a4b16]">
            Verbinding hapert — hieronder staat het laatst binnengekomen beeld.
          </p>
        ) : null}
      </header>

      {state.mode === "demo" ? (
        <p className="mb-6 rounded-lg border border-[#F5A46C] bg-[#F5A46C]/20 px-4 py-3 text-sm text-[#1F1F1F]">
          Demoweergave — drempel uit, losse antwoorden zichtbaar. Niet gebruiken bij een echte
          ronde.
        </p>
      ) : null}

      <section
        className={`mb-6 rounded-lg border px-5 py-4 transition-colors duration-700 ${
          flash.has("rate") ? "border-[#27CFC3] bg-[#27CFC3]/20" : "border-[#e5e0d8] bg-white"
        }`}
      >
        <p className="text-3xl font-semibold text-[#1F1F1F]">
          {stats.invited > 0
            ? `${stats.responded} van ${stats.invited} binnen`
            : `${stats.responded} binnen`}
        </p>
        <p className="mt-1 text-sm text-[#5b5b5b]">
          {stats.invited > 0
            ? `Responspercentage ${Math.round(stats.responseRate * 100)}% · ${stats.answers} scores geteld`
            : `${stats.answers} scores geteld`}
        </p>
      </section>

      {alleenTeller ? (
        <p className="rounded-lg border border-[#e5e0d8] bg-white px-5 py-4 text-sm text-[#5b5b5b]">
          Productieronde: zolang de ronde loopt tonen we alleen hoeveel mensen hebben ingevuld.
          Scores, losse antwoorden en inzichten verschijnen pas als de ronde gesloten is.
        </p>
      ) : (
        <>
          <ThemeSection stats={stats} flash={flash} />
          <InsightSection current={state.current} note={state.note} flash={flash} />
          <TrailSection versions={trail} invited={stats.invited} flash={flash} />
          <FeedSection feed={state.feed} flash={flash} />
        </>
      )}
    </main>
  );
}

function ThemeSection({ stats, flash }: { stats: RoundState["stats"]; flash: Set<string> }) {
  if (stats.themes.length === 0) {
    return (
      <p className="mb-8 text-sm text-[#5b5b5b]">Nog geen scores binnen om te tonen.</p>
    );
  }
  const byKey = new Map(stats.themes.map((theme) => [theme.theme, theme]));
  const geordend = stats.agenda.flatMap((key) => {
    const theme = byKey.get(key);
    return theme ? [theme] : [];
  });

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[#5b5b5b]">
        Gespreksagenda — laagste eerst
      </h2>
      {stats.belowThreshold ? (
        <p className="mb-3 text-xs text-[#5b5b5b]">
          Onder {stats.thresholdN} antwoorden is dit een gespreksagenda, geen meting: alleen
          aantallen, geen percentages en geen uitsplitsingen.
        </p>
      ) : null}
      <div className="grid gap-3">
        {geordend.map((theme) => (
          <ThemeCard
            key={theme.theme}
            theme={theme}
            belowThreshold={stats.belowThreshold}
            flashed={flash.has(`theme:${theme.theme}`)}
          />
        ))}
      </div>
    </section>
  );
}

function ThemeCard({
  theme,
  belowThreshold,
  flashed,
}: {
  theme: ThemeStat;
  belowThreshold: boolean;
  flashed: boolean;
}) {
  const meta = THEME_BY_KEY.get(theme.theme);
  const kleur = meta?.kleur ?? "#00B0A8";
  const hoogste = Math.max(1, ...theme.counts);

  return (
    <article
      className={`rounded-lg border bg-white p-4 transition-colors duration-700 ${
        flashed ? "border-[#27CFC3] bg-[#27CFC3]/10" : "border-[#e5e0d8]"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: kleur }} />
        <h3 className="font-semibold text-[#1F1F1F]">{meta?.naam ?? theme.theme}</h3>
        <span className="ml-auto font-[family-name:var(--font-plex-mono)] text-xs text-[#5b5b5b]">
          n = {theme.answers}
        </span>
      </div>

      <div className="grid gap-1">
        {theme.counts.map((count, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-3 font-[family-name:var(--font-plex-mono)] text-xs text-[#5b5b5b]">
              {index + 1}
            </span>
            <span className="h-2 flex-1 rounded-sm bg-[#f1ede6]">
              <span
                className="block h-2 rounded-sm transition-all duration-500"
                style={{ width: `${(count / hoogste) * 100}%`, background: kleur }}
              />
            </span>
            <span className="w-4 text-right font-[family-name:var(--font-plex-mono)] text-xs text-[#5b5b5b]">
              {count}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-[#1F1F1F]">
        {theme.top2} van de {theme.answers} gaven een 4 of 5 · {theme.bottom2} van de{" "}
        {theme.answers} gaven een 1 of 2
        {belowThreshold ? "" : ` · gemiddeld ${theme.mean.toFixed(1)}`}
      </p>
    </article>
  );
}

function InsightSection({
  current,
  note,
  flash,
}: {
  current: InsightVersion | null;
  note: string | null;
  flash: Set<string>;
}) {
  return (
    <section
      className={`mb-8 rounded-lg border p-5 transition-colors duration-700 ${
        flash.has("insight") ? "border-[#27CFC3] bg-[#27CFC3]/10" : "border-[#e5e0d8] bg-white"
      }`}
    >
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#5b5b5b]">
        Huidig inzicht
      </h2>
      {current ? (
        <>
          <p className="text-[#1F1F1F]">{current.summary}</p>
          <div className="mt-4 grid gap-4">
            {current.insights.map((insight) => (
              <article key={insight.kop} className="border-l-2 border-[#00B0A8] pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[#1F1F1F]">{insight.kop}</h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${URGENTIE[insight.urgentie]}`}
                  >
                    {insight.urgentie}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5b5b5b]">{insight.bewijs}</p>
                <p className="mt-1 text-sm text-[#1F1F1F]">{insight.actie}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 font-[family-name:var(--font-plex-mono)] text-xs text-[#5b5b5b]">
            na antwoord {current.n_responses} · {current.model ?? "geen model"}
          </p>
        </>
      ) : (
        <p className="text-sm text-[#5b5b5b]">{note ?? "Nog geen inzicht voor deze ronde."}</p>
      )}
    </section>
  );
}

function TrailSection({
  versions,
  invited,
  flash,
}: {
  versions: InsightVersion[];
  invited: number;
  flash: Set<string>;
}) {
  if (versions.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[#5b5b5b]">
        Wat elk antwoord veranderde
      </h2>
      <p className="mb-3 text-xs text-[#5b5b5b]">Nieuwste bovenaan.</p>
      <ol className="grid gap-2">
        {versions.map((version, index) => (
          <li
            key={version.n_responses}
            className={`rounded-lg border p-4 transition-colors duration-700 ${
              flash.has(`version:${version.n_responses}`)
                ? "border-[#27CFC3] bg-[#27CFC3]/15"
                : "border-[#e5e0d8] bg-white"
            }`}
          >
            <p className="font-[family-name:var(--font-plex-mono)] text-xs uppercase tracking-wide text-[#5b5b5b]">
              na antwoord {version.n_responses}
              {invited > 0 ? ` van ${invited}` : ""}
            </p>
            <ul className="mt-2 grid gap-1 text-sm text-[#1F1F1F]">
              {describeChange(version, versions[index + 1]).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FeedSection({ feed, flash }: { feed: FeedItem[]; flash: Set<string> }) {
  if (feed.length === 0) return null;
  const nieuwsteEerst = [...feed].reverse();

  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[#5b5b5b]">
        Binnengekomen
      </h2>
      <p className="mb-3 text-xs text-[#5b5b5b]">Nieuwste bovenaan.</p>
      <div className="grid gap-3">
        {nieuwsteEerst.map((item) => (
          <article
            key={item.index}
            className={`rounded-lg border p-4 transition-colors duration-700 ${
              flash.has(`feed:${item.index}`)
                ? "border-[#27CFC3] bg-[#27CFC3]/15"
                : "border-[#e5e0d8] bg-white"
            }`}
          >
            <p className="font-[family-name:var(--font-plex-mono)] text-xs text-[#5b5b5b]">
              antwoord {item.index} · {tijd(item.at)} · {item.segment}
            </p>
            <div className="mt-2 grid gap-1">
              {item.scores.map((score) => (
                <div key={score.code} className="flex items-center gap-2" title={score.text}>
                  <span className="w-12 font-[family-name:var(--font-plex-mono)] text-xs text-[#5b5b5b]">
                    {score.code}
                  </span>
                  <Dots
                    score={score.score}
                    kleur={THEME_BY_KEY.get(score.theme)?.kleur ?? "#00B0A8"}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-[#1F1F1F]">
              {item.openText ? `“${item.openText}”` : <span className="text-[#5b5b5b]">geen open antwoord</span>}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Dots({ score, kleur }: { score: number; kleur: string }) {
  return (
    <span className="flex items-center gap-1" aria-label={`score ${score} van 5`}>
      {[1, 2, 3, 4, 5].map((punt) => (
        <span
          key={punt}
          className="h-2.5 w-2.5 rounded-full border"
          style={{
            borderColor: kleur,
            background: punt === score ? kleur : "transparent",
          }}
        />
      ))}
    </span>
  );
}

/** Which parts moved since the previous poll — the only source of the highlight. */
function changedKeys(before: LiveState | null, after: LiveState): Set<string> {
  const keys = new Set<string>();
  if (!before) return keys; // the first paint is not a change

  if (before.stats.responded !== after.stats.responded) keys.add("rate");

  for (const theme of after.stats.themes) {
    const eerder = before.stats.themes.find((other) => other.theme === theme.theme);
    if (!eerder || eerder.counts.join() !== theme.counts.join()) keys.add(`theme:${theme.theme}`);
  }

  const bekendeAntwoorden = new Set(before.feed.map((item) => item.index));
  for (const item of after.feed) {
    if (!bekendeAntwoorden.has(item.index)) keys.add(`feed:${item.index}`);
  }

  const bekendeVersies = new Set(before.versions.map((version) => version.n_responses));
  for (const version of after.versions) {
    if (!bekendeVersies.has(version.n_responses)) keys.add(`version:${version.n_responses}`);
  }

  if (before.current?.generated_at !== after.current?.generated_at) keys.add("insight");
  return keys;
}

/**
 * The version trail is the demo: one answer in, and these lines say what it did.
 * Insights are matched on `kop` — the only stable handle the model gives us.
 */
function describeChange(newer: InsightVersion, older: InsightVersion | undefined): string[] {
  if (!older) return ["Eerste inzicht van deze ronde."];

  const lines: string[] = [];
  const eerder = new Map(older.insights.map((insight) => [insight.kop, insight]));
  const nu = new Set(newer.insights.map((insight) => insight.kop));

  for (const insight of newer.insights) {
    const vorige = eerder.get(insight.kop);
    if (!vorige) lines.push(`nieuw: “${insight.kop}”`);
    else if (vorige.urgentie !== insight.urgentie) {
      lines.push(`“${insight.kop}”: urgentie ${vorige.urgentie} → ${insight.urgentie}`);
    }
  }
  for (const insight of older.insights) {
    if (!nu.has(insight.kop)) lines.push(`vervallen: “${insight.kop}”`);
  }
  if (lines.length === 0) lines.push("Niets veranderd aan de inzichten.");
  return lines;
}

function tijd(at: string): string {
  const date = new Date(at);
  return Number.isNaN(date.getTime())
    ? at
    : date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}
