"use client";

import { useCallback, useEffect, useState } from "react";
import type { InviteView } from "@/app/api/vragen/[token]/route";
import { THEMAS } from "@/components/welzijn/data";

const SCHAAL = [1, 2, 3, 4, 5];

/** Fallback keeps an unknown theme readable instead of blank. */
function thema(key: string) {
  return THEMAS.find((t) => t.key === key) ?? { key, naam: key, kleur: "#8a8a8a" };
}

type Fase = "laden" | "vragen" | "verstuurd";

export default function PulseForm({ token }: { token: string }) {
  const [invite, setInvite] = useState<InviteView | null>(null);
  const [laadFout, setLaadFout] = useState<string | null>(null);
  const [fase, setFase] = useState<Fase>("laden");

  const [stap, setStap] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [openText, setOpenText] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    let afgebroken = false;
    async function laden() {
      try {
        const response = await fetch(`/api/vragen/${encodeURIComponent(token)}`);
        const data: unknown = await response.json();
        if (afgebroken) return;
        if (!response.ok) {
          const melding =
            typeof data === "object" && data !== null && "error" in data
              ? String((data as { error: unknown }).error)
              : "Er ging iets mis bij het ophalen van je vragen.";
          setLaadFout(melding);
          return;
        }
        setInvite(data as InviteView);
      } catch {
        if (!afgebroken) setLaadFout("We konden je vragen niet ophalen. Probeer het zo nog eens.");
      } finally {
        if (!afgebroken) setFase("vragen");
      }
    }
    void laden();
    return () => {
      afgebroken = true;
    };
  }, [token]);

  const versturen = useCallback(async () => {
    setBezig(true);
    setFout(null);
    try {
      const response = await fetch(`/api/vragen/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scores, openText: openText.trim() || undefined }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const melding =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : "Je antwoorden konden niet worden opgeslagen.";
        setFout(melding);
        return;
      }
      setFase("verstuurd");
    } catch {
      setFout("Je antwoorden konden niet worden verstuurd. Controleer je verbinding.");
    } finally {
      setBezig(false);
    }
  }, [token, scores, openText]);

  if (fase === "laden") {
    return (
      <Scherm>
        <p className="text-[#7a7a7a]">Je vragen worden opgehaald…</p>
      </Scherm>
    );
  }

  if (laadFout || !invite) {
    return (
      <Scherm>
        <h1 className="mb-3 text-2xl font-bold tracking-tight">Deze link bestaat niet (meer)</h1>
        <p className="leading-relaxed text-[#5c5c5c]">
          {laadFout ?? "Vraag degene die de pulse verstuurde om een nieuwe link."}
        </p>
      </Scherm>
    );
  }

  if (fase === "verstuurd" || invite.completed) {
    const alIngevuld = fase !== "verstuurd";
    return (
      <Scherm>
        <div className="mb-5 h-1.5 w-12 rounded-full bg-[#00B0A8]" />
        <h1 className="mb-3 text-2xl font-bold tracking-tight">
          {alIngevuld ? "Deze pulse is al ingevuld" : "Dank je wel"}
        </h1>
        <p className="mb-3 leading-relaxed text-[#5c5c5c]">
          {alIngevuld
            ? "Je antwoorden zijn eerder al binnengekomen. Je kunt dit venster sluiten."
            : "Je antwoorden zijn binnen. Ze zijn anoniem: niemand kan zien wat jij hebt ingevuld."}
        </p>
        <p className="leading-relaxed text-[#5c5c5c]">
          De ronde loopt live mee — elk antwoord telt er direct in mee.
        </p>
      </Scherm>
    );
  }

  const laatsteStap = stap === invite.total - 1;
  const vraag = laatsteStap ? null : invite.questions[stap];
  const thuis = vraag ? thema(vraag.theme) : null;
  const gescoord = vraag ? Boolean(scores[vraag.id]) : true;

  return (
    <Scherm>
      {stap === 0 ? (
        <div className="mb-7">
          <p className="mb-2 font-[family-name:var(--font-plex-mono)] text-[10.5px] tracking-[0.16em] text-[#00857f] uppercase">
            {invite.kind === "diepte" ? "Diepte-pulse" : "Flitspulse"} · {invite.label}
          </p>
          <h1 className="mb-3 text-2xl font-bold tracking-tight">Hoe gaat het met je werk?</h1>
          <p className="leading-relaxed text-[#5c5c5c]">
            {invite.total} korte vragen, ongeveer twee minuten. Je antwoorden zijn anoniem — ze
            worden nooit aan jouw naam gekoppeld.
          </p>
        </div>
      ) : null}

      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-[family-name:var(--font-plex-mono)] text-[11px] tracking-[0.14em] text-[#7a7a7a] uppercase">
            vraag {stap + 1} van {invite.total}
          </span>
          {thuis ? (
            <span
              className="rounded-full px-2.5 py-1 text-[12px] font-medium text-white"
              style={{ background: thuis.kleur }}
            >
              {thuis.naam}
            </span>
          ) : null}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eceae6]">
          <div
            className="h-full rounded-full bg-[#00B0A8] transition-[width] duration-300"
            style={{ width: `${((stap + 1) / invite.total) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-[5px] border border-[#e8e6e2] bg-white p-5 sm:p-7">
        {vraag ? (
          <>
            <p className="mb-6 text-xl leading-snug font-semibold text-pretty sm:text-2xl">
              {vraag.text}
            </p>
            <div className="flex gap-2">
              {SCHAAL.map((waarde) => {
                const gekozen = scores[vraag.id] === waarde;
                return (
                  <button
                    key={waarde}
                    type="button"
                    aria-pressed={gekozen}
                    onClick={() => setScores((huidig) => ({ ...huidig, [vraag.id]: waarde }))}
                    className={`h-14 flex-1 rounded-[5px] border text-lg font-semibold transition-colors ${
                      gekozen
                        ? "border-[#00B0A8] bg-[#00B0A8] text-white"
                        : "border-[#dcdad6] bg-white text-[#1F1F1F] hover:border-[#00B0A8]"
                    }`}
                  >
                    {waarde}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[12.5px] text-[#8a8a8a]">
              <span>oneens</span>
              <span>eens</span>
            </div>
          </>
        ) : (
          <>
            <p className="mb-2 text-xl leading-snug font-semibold text-pretty sm:text-2xl">
              Nog iets in je eigen woorden?
            </p>
            <p className="mb-4 text-[14.5px] leading-relaxed text-[#5c5c5c]">
              Deze vraag is vrijwillig.
            </p>
            <textarea
              value={openText}
              onChange={(event) => setOpenText(event.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Wat wil je verder kwijt? (mag leeg blijven)"
              className="w-full resize-y border border-[#dcdad6] bg-transparent p-3 text-[15.5px] leading-relaxed"
            />
          </>
        )}
      </div>

      {fout ? (
        <p className="mt-4 rounded-[5px] border border-[#f0c9a8] bg-[#fdf3ea] p-3 text-[14.5px] leading-relaxed text-[#8a4b1f]">
          {fout}
        </p>
      ) : null}

      <div className="mt-6 flex items-center gap-3">
        {stap > 0 ? (
          <button
            type="button"
            onClick={() => {
              setFout(null);
              setStap((huidig) => huidig - 1);
            }}
            className="rounded-full border border-[#dcdad6] bg-white px-5 py-3 text-[15px] text-[#1F1F1F] hover:border-[#00B0A8]"
          >
            Terug
          </button>
        ) : null}
        <span className="flex-1" />
        {laatsteStap ? (
          <button
            type="button"
            disabled={bezig}
            onClick={versturen}
            className="rounded-full bg-[#F5A46C] px-7 py-3 text-[15px] font-semibold text-white hover:bg-[#f7b587] disabled:opacity-50"
          >
            {bezig ? "Bezig…" : "Versturen"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!gescoord}
            onClick={() => setStap((huidig) => huidig + 1)}
            className="rounded-full bg-[#00B0A8] px-7 py-3 text-[15px] font-semibold text-white hover:bg-[#27CFC3] disabled:opacity-40"
          >
            Volgende
          </button>
        )}
      </div>
    </Scherm>
  );
}

function Scherm({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#fbfaf8] px-5 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex items-baseline gap-2.5">
          <span className="text-[21px] font-bold tracking-[-0.03em]">namber</span>
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#00B0A8]" />
          <span className="font-[family-name:var(--font-plex-mono)] text-[10.5px] tracking-[0.14em] text-[#6b6b6b] uppercase">
            welzijn pulse
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}
