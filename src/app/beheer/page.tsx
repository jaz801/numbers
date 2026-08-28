"use client";

/**
 * /beheer — open a round and copy the links.
 *
 * The whole hand-sent route in one screen: pick flits or diepte, open the
 * round, copy three links into WhatsApp or a mail, and open the dashboard.
 * The secret is typed here and kept in component state only; it is never
 * stored, so a shared laptop does not become a shared round.
 */

import { useCallback, useEffect, useState } from "react";

type Link = {
  person: string;
  email: string;
  segment: "intern" | "extern";
  url: string;
  questions: { code: string; theme: string; text: string }[];
};

type Round = {
  pulseId: string;
  kind: "flits" | "diepte";
  label: string;
  questionCount: number;
  dashboardUrl: string;
  links: Link[];
};

type ExistingLink = {
  person: string;
  email: string;
  segment: "intern" | "extern";
  url: string;
  completedAt: string | null;
};

type ExistingRound = {
  pulseId: string;
  label: string;
  kind: "flits" | "diepte";
  status: "concept" | "verstuurd" | "gesloten";
  createdAt: string;
  dashboardUrl: string;
  responseCount: number;
  links: ExistingLink[];
};

const TEAL = "#00B0A8";
const APRICOT = "#F5A46C";

export default function Beheer() {
  const [secret, setSecret] = useState("");
  const [kind, setKind] = useState<"flits" | "diepte">("flits");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);
  const [rounds, setRounds] = useState<ExistingRound[] | null>(null);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [roundsError, setRoundsError] = useState<string | null>(null);
  const [openRound, setOpenRound] = useState<string | null>(null);

  /**
   * The links are the round: without them nobody can answer. So they are read
   * back from the server every time a secret is on screen, instead of living
   * only in the state of the tab that opened the round.
   */
  const loadRounds = useCallback(async (pulseSecret: string) => {
    if (!pulseSecret) {
      setRounds(null);
      setRoundsError(null);
      return;
    }
    setLoadingRounds(true);
    try {
      const response = await fetch("/api/rondes", {
        headers: { "x-pulse-secret": pulseSecret },
        cache: "no-store",
      });
      const body = (await response.json()) as { rounds?: ExistingRound[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? `Serverfout ${response.status}`);
      setRounds(body.rounds ?? []);
      setRoundsError(null);
    } catch (problem) {
      setRounds(null);
      setRoundsError(problem instanceof Error ? problem.message : String(problem));
    } finally {
      setLoadingRounds(false);
    }
  }, []);

  // Debounced, so typing the secret does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => void loadRounds(secret), 400);
    return () => clearTimeout(timer);
  }, [secret, loadRounds]);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/rondes", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pulse-secret": secret },
        body: JSON.stringify({ kind, label: label.trim() || undefined }),
      });
      const body = (await response.json()) as Round & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Serverfout ${response.status}`);
      setRound(body);
      void loadRounds(secret);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : String(problem));
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
    } catch {
      // Clipboard access can be refused; the link is on screen and selectable.
      setCopied(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-[#1F1F1F]">
      <h1 className="text-2xl font-semibold">Ronde openen</h1>
      <p className="mt-2 text-sm text-black/60">
        Maakt de uitnodigingen aan en geeft je de links terug. Er gaat niets de deur uit —
        je stuurt ze zelf. Elke deelnemer krijgt een eigen, willekeurig getrokken set vragen.
      </p>

      <section className="mt-6 rounded-2xl border border-black/10 p-5">
        <label className="block text-sm font-medium" htmlFor="secret">
          Pulse-secret
        </label>
        <input
          id="secret"
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
          placeholder="PULSE_ADMIN_SECRET"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {(["flits", "diepte"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className="rounded-full px-4 py-2 text-sm font-medium transition"
              style={
                kind === option
                  ? { background: TEAL, color: "#fff" }
                  : { background: "#F3F4F4", color: "#1F1F1F" }
              }
            >
              {option === "flits" ? "Flitspulse — 5 vragen" : "Dieptepulse — 12 vragen"}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium" htmlFor="label">
          Label <span className="font-normal text-black/50">(optioneel)</span>
        </label>
        <input
          id="label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
          placeholder="Flitspulse september"
        />

        <button
          type="button"
          onClick={open}
          disabled={busy || !secret}
          className="mt-5 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: APRICOT }}
        >
          {busy ? "Bezig…" : "Ronde openen"}
        </button>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      {round ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            {round.label} · {round.questionCount} vragen per persoon
          </h2>

          <div className="mt-3 rounded-2xl border border-black/10 p-4">
            <p className="text-sm font-medium">Dashboard (live)</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-black/5 px-2 py-1 text-xs">
                {round.dashboardUrl}
              </code>
              <button
                type="button"
                onClick={() => copy(round.dashboardUrl, "dashboard")}
                className="rounded-full border border-black/15 px-3 py-1 text-xs"
              >
                {copied === "dashboard" ? "gekopieerd" : "kopieer"}
              </button>
              <a
                href={round.dashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ background: TEAL }}
              >
                open
              </a>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {round.links.map((link) => (
              <li key={link.url} className="rounded-2xl border border-black/10 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {link.person}{" "}
                    <span className="text-xs font-normal text-black/50">
                      {link.email} · {link.segment}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setShown((current) => (current === link.url ? null : link.url))}
                    className="text-xs underline decoration-dotted"
                  >
                    {shown === link.url ? "verberg vragen" : `bekijk ${link.questions.length} vragen`}
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-black/5 px-2 py-1 text-xs">
                    {link.url}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(link.url, link.url)}
                    className="rounded-full border border-black/15 px-3 py-1 text-xs"
                  >
                    {copied === link.url ? "gekopieerd" : "kopieer"}
                  </button>
                </div>

                {shown === link.url ? (
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-black/70">
                    {link.questions.map((question) => (
                      <li key={question.code}>
                        <span className="font-mono text-[10px] text-black/40">{question.code}</span>{" "}
                        {question.text}
                      </li>
                    ))}
                    <li className="text-black/50">Open vraag — wat wil je verder kwijt?</li>
                  </ol>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Bestaande rondes</h2>
          <button
            type="button"
            onClick={() => void loadRounds(secret)}
            disabled={!secret || loadingRounds}
            className="rounded-full border border-black/15 px-3 py-1 text-xs disabled:opacity-40"
          >
            {loadingRounds ? "laden…" : "ververs"}
          </button>
        </div>
        <p className="mt-1 text-sm text-black/60">
          Links raak je hier niet meer kwijt. Vul je secret in en je krijgt ze allemaal
          terug — inclusief wie al geantwoord heeft.
        </p>

        {!secret ? (
          <p className="mt-3 text-sm text-black/50">Vul hierboven je pulse-secret in.</p>
        ) : null}
        {roundsError ? <p className="mt-3 text-sm text-red-700">{roundsError}</p> : null}
        {secret && !roundsError && rounds?.length === 0 ? (
          <p className="mt-3 text-sm text-black/50">Nog geen rondes geopend.</p>
        ) : null}

        <ul className="mt-4 space-y-3">
          {(rounds ?? []).map((item) => {
            const done = item.links.filter((link) => link.completedAt).length;
            return (
              <li key={item.pulseId} className="rounded-2xl border border-black/10 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {item.label}{" "}
                    <span className="text-xs font-normal text-black/50">
                      {item.kind === "diepte" ? "diepte" : "flits"} · {item.status} ·{" "}
                      {new Date(item.createdAt).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </p>
                  <span className="text-xs text-black/60">
                    {done}/{item.links.length} beantwoord · {item.responseCount}{" "}
                    {item.responseCount === 1 ? "antwoord" : "antwoorden"}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-black/5 px-2 py-1 text-xs">
                    {item.dashboardUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(item.dashboardUrl, `dash-${item.pulseId}`)}
                    className="rounded-full border border-black/15 px-3 py-1 text-xs"
                  >
                    {copied === `dash-${item.pulseId}` ? "gekopieerd" : "kopieer"}
                  </button>
                  <a
                    href={item.dashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ background: TEAL }}
                  >
                    dashboard
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpenRound((current) => (current === item.pulseId ? null : item.pulseId))
                  }
                  className="mt-3 text-xs underline decoration-dotted"
                >
                  {openRound === item.pulseId
                    ? "verberg links"
                    : `toon ${item.links.length} links`}
                </button>

                {openRound === item.pulseId ? (
                  <ul className="mt-3 space-y-2">
                    {item.links.map((link) => (
                      <li key={link.url} className="rounded-xl bg-black/[0.03] p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-medium">
                            {link.person}{" "}
                            <span className="text-xs font-normal text-black/50">
                              {link.email} · {link.segment}
                            </span>
                          </p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={
                              link.completedAt
                                ? { background: TEAL, color: "#fff" }
                                : { background: APRICOT, color: "#fff" }
                            }
                          >
                            {link.completedAt ? "heeft geantwoord" : "nog niet geantwoord"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="flex-1 truncate rounded-lg bg-black/5 px-2 py-1 text-xs">
                            {link.url}
                          </code>
                          <button
                            type="button"
                            onClick={() => copy(link.url, link.url)}
                            className="rounded-full border border-black/15 bg-white px-3 py-1 text-xs"
                          >
                            {copied === link.url ? "gekopieerd" : "kopieer"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
