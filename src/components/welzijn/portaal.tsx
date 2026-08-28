"use client";

/**
 * Welzijn Portaal — the three-step pulse demo: pick the employees, set the
 * rhythm and the questions, read the outcome.
 *
 * Ported from the design of the same name. The markup lives in
 * `portaal-view.tsx` (generated from the design), this file holds the state
 * and every derived value that markup binds to.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { Component } from "react";
import * as htmlToImage from "html-to-image";
import {
  ADVIES,
  AVATAR_KLEUREN,
  CONTEXTEN,
  DAGEN,
  HISTORIE,
  PULSE_LABELS,
  SCHAAL,
  THEMAS,
  VRAGEN,
  init,
  tokenize,
  type Vraag,
} from "./data";
import { DEMO_PEOPLE, type Persoon } from "./people";
import { hoverCss, renderView } from "./portaal-view";

type Props = {
  /** Which of the three steps opens first. */
  startScreen?: string;
  randomiseerStandaard?: boolean;
  anoniemStandaard?: boolean;
  /** Privacy threshold n. Production runs on 5; the demo may go lower. */
  demoDrempel?: number;
};

type State = any;
type Reeks = { key: string; kleur: string; waarden: (number | null)[] };
/**
 * Theme key -> average score, or null when nobody answered on that theme.
 * Deliberately loose: the ported logic compares and sorts those nulls the way
 * JavaScript does, and tightening it here would change the demo's behaviour.
 */
type ScoreMap = Record<string, any>;
type Bewijs = {
  vraag: string;
  id: string;
  score: number;
  wie: string;
  scoreStyle: string;
};

export default class WelzijnPortaal extends Component<Props, State> {
  state: State = {
    screen: this.props.startScreen || "portaal",
    people: DEMO_PEOPLE.map((p) => Object.assign({}, p)),
    nieuwNaam: "", nieuwEmail: "", nieuwType: "intern", nieuwFoto: null, nieuwContext: "geen", formMelding: "Foto is optioneel. Beeld wordt teruggeschaald naar 200 bij 200 pixels.",
    interval: "maandelijks",
    dagen: ["di", "do"],
    randomiseer: this.props.randomiseerStandaard !== false,
    randomDagen: false,
    anoniem: this.props.anoniemStandaard !== false,
    drempel: this.props.demoDrempel || 2,
    uitVragen: [],
    eigenVragen: [],
    nieuwVraag: "", nieuwVraagThema: "WD",
    invites: {},
    verzonden: false, verzendBezig: false,
    gekopieerd: null,
    actieveToken: null, pulseScores: {}, pulseOpenTekst: "", pulseKlaar: false,
    responses: [
      { token: "seed1", personId: "p1", type: "intern", scores: { WD01: 2, OR01: 4, SV01: 4, WZ01: 4 }, open: "Het werk zelf is prima, maar de weken lopen vol met overleg dat ook een bericht had kunnen zijn." },
      { token: "seed2", personId: "p2", type: "intern", scores: { WD02: 3, OR02: 3, SV03: 5, WZ01: 5 }, open: "Ik vind het fijn dat er ruimte is om iets niet te weten." },
      { token: "seed3", personId: "p3", type: "extern", scores: { WD01: 3, OR03: 2, SV02: 4, WZ03: 4 }, open: "Als externe mis ik soms context over waarom een keuze gemaakt is." }
    ],
    dashView: "org", gekozenPersoon: "p1", exportAnoniem: false, openBewijs: null,
    notities: {
      p1: [{ tekst: "Afgesproken: dinsdag en donderdag geen overleggen voor 11:00.", datum: "12 aug" }],
      p2: [], p3: []
    },
    nieuweNotitie: "",
    insights: null, insightsBezig: false,
    exportLabel: "Exporteer CSV"
  };

  actieveVragen() {
    const alle = VRAGEN.concat(this.state.eigenVragen);
    return alle.filter(v => !this.state.uitVragen.includes(v.id));
  }

  kiesVragenVoor() {
    const pool = this.actieveVragen();
    const uit: string[] = [];
    THEMAS.forEach(t => {
      const perThema = pool.filter(v => v.t === t.key);
      if (!perThema.length) return;
      const gekozen = this.state.randomiseer
        ? perThema[Math.floor(Math.random() * perThema.length)]
        : (perThema.find(v => v.kern) || perThema[0]);
      uit.push(gekozen.id);
    });
    return uit;
  }

  themaVan(id: string) {
    const v = VRAGEN.concat(this.state.eigenVragen).find(x => x.id === id);
    return v ? v.t : null;
  }

  gemiddelde(filterType: string | null) {
    const per: Record<string, number[]> = {};
    THEMAS.forEach(t => per[t.key] = []);
    this.state.responses.forEach((r: any) => {
      if (filterType && r.type !== filterType) return;
      Object.keys(r.scores).forEach(qid => {
        const th = this.themaVan(qid);
        if (th) per[th].push(r.scores[qid]);
      });
    });
    const out: ScoreMap = {};
    THEMAS.forEach(t => {
      const a = per[t.key];
      out[t.key] = a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    });
    return out;
  }

  fmt(n: number | null | undefined) { return n == null ? "–" : n.toFixed(1).replace(".", ","); }

  delta(n: number | null | undefined) {
    if (n == null) return "";
    const t = (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(1).replace(".", ",");
    return t + " t.o.v. organisatie";
  }

  persoonScores(pid: string) {
    const per: Record<string, number[]> = {};
    THEMAS.forEach(t => per[t.key] = []);
    this.state.responses.filter((r: any) => r.personId === pid).forEach((r: any) => {
      Object.keys(r.scores).forEach(qid => {
        const th = this.themaVan(qid);
        if (th) per[th].push(r.scores[qid]);
      });
    });
    const out: ScoreMap = {};
    THEMAS.forEach(t => {
      const a = per[t.key];
      out[t.key] = a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    });
    return out;
  }

  duurTekst(min: number | null | undefined) {
    if (min == null) return "–";
    if (min < 60) return Math.round(min) + " min";
    if (min < 1440) return (min / 60).toFixed(1).replace(".", ",") + " uur";
    return (min / 1440).toFixed(1).replace(".", ",") + " dag";
  }

  betrokkenheid() {
    const inv = Object.keys(this.state.invites).map(k => this.state.invites[k]);
    const liveTijden = inv.filter(i => i.ingevuld && i.verstuurdOp && i.ingevuldOp)
      .map(i => (i.ingevuldOp - i.verstuurdOp) / 60000);
    const voorbeeld = [42, 190, 1420];
    const tijden = liveTijden.concat(voorbeeld).sort((a, b) => a - b);
    const uitgenodigd = inv.length + voorbeeld.length;
    const ingevuld = liveTijden.length + voorbeeld.length;
    const mediaan = tijden.length ? tijden[Math.floor(tijden.length / 2)] : null;
    const buckets = [
      { label: "binnen 1 uur", n: tijden.filter(t => t < 60).length, kleur: "#00B0A8" },
      { label: "binnen 1 dag", n: tijden.filter(t => t >= 60 && t < 1440).length, kleur: "#27CFC3" },
      { label: "later dan 1 dag", n: tijden.filter(t => t >= 1440).length, kleur: "#F5A46C" },
      { label: "nog niet ingevuld", n: Math.max(0, uitgenodigd - ingevuld), kleur: "#dcdad6" }
    ];
    return {
      uitgenodigd, ingevuld,
      graad: uitgenodigd ? Math.round((ingevuld / uitgenodigd) * 100) : 0,
      mediaan: this.duurTekst(mediaan),
      snelste: this.duurTekst(tijden[0]),
      langzaamste: this.duurTekst(tijden[tijden.length - 1]),
      liveAantal: liveTijden.length,
      buckets: buckets.map(b => Object.assign({}, b, {
        pct: uitgenodigd ? Math.round((b.n / uitgenodigd) * 100) : 0,
        balk: "height:8px;border-radius:200px;background:" + b.kleur + ";width:" + (uitgenodigd ? Math.round((b.n / uitgenodigd) * 100) : 0) + "%"
      }))
    };
  }

  bewijsVoor(key: string) {
    const alleVr: Vraag[] = VRAGEN.concat(this.state.eigenVragen);
    const uit: Bewijs[] = [];
    this.state.responses.forEach((r: any, ri: any) => {
      const p = this.state.people.find((x: any) => x.id === r.personId);
      const idx = p ? this.state.people.indexOf(p) : ri;
      Object.keys(r.scores).forEach(qid => {
        if (this.themaVan(qid) !== key) return;
        const v = alleVr.find(x => x.id === qid) || { tekst: qid };
        const sv = r.scores[qid];
        uit.push({
          vraag: v.tekst, id: qid, score: sv,
          wie: (p ? this.naamVoor(p, idx) : "onbekend") + " · " + r.type,
          scoreStyle: "font-family:var(--font-plex-mono),monospace;font-size:12.5px;font-weight:500;padding:3px 9px;border-radius:200px;flex:none;background:" +
            (sv <= 2 ? "#fbf0e7" : sv === 3 ? "#f3f1ec" : "#eaf6f5") + ";color:" + (sv <= 2 ? "#8a4b1f" : sv === 3 ? "#5c5c5c" : "#00857f")
        });
      });
    });
    return uit.sort((a, b) => a.score - b.score);
  }

  adviesVoor(key: string, score: number | null) {
    const a = ADVIES[key] || ADVIES.WD;
    if (score == null) return "Nog geen antwoord op dit thema — neem het mee in de volgende pulse.";
    if (score < 3) return a.laag;
    if (score < 4) return a.midden;
    return a.hoog;
  }

  niveau(score: number | null) { return score == null ? "geen data" : score < 3 ? "aandacht" : score < 4 ? "let op" : "sterk"; }
  niveauKleur(score: number | null) { return score == null ? "#9a9a9a" : score < 3 ? "#8a4b1f" : score < 4 ? "#00857f" : "#00857f"; }

  naamVoor(p: Persoon, i: number) { return this.state.exportAnoniem ? "Werknemer " + (i + 1) : p.naam; }

  trendVan(pid: string, key: string, huidig: number | null) {
    const h = (HISTORIE[pid] || {})[key];
    if (!h || !h.length || huidig == null) return { tekst: "eerste meting", kleur: "#9a9a9a", punten: h || [] };
    const vorige = h[h.length - 1];
    const d = huidig - vorige;
    const abs = Math.abs(d).toFixed(1).replace(".", ",");
    if (Math.abs(d) < 0.15) return { tekst: "gelijk t.o.v. voorbeeldreeks", kleur: "#9a9a9a", punten: h };
    return d > 0
      ? { tekst: "▲ " + abs + " t.o.v. juli (voorbeeld)", kleur: "#00857f", punten: h }
      : { tekst: "▼ " + abs + " t.o.v. juli (voorbeeld)", kleur: "#8a4b1f", punten: h };
  }

  orgHistorie(key: string) {
    const ids = Object.keys(HISTORIE);
    const uit: (number | null)[] = [];
    for (let i = 0; i < PULSE_LABELS.length; i++) {
      const vals = ids.map(id => (HISTORIE[id][key] || [])[i]).filter(v => v != null);
      uit.push(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
    }
    return uit;
  }

  chartEl(reeksen: Reeks[], labels: string[]) {
    const W = 560, H = 210, L = 34, R = 12, T = 12, B = 26;
    const iw = W - L - R, ih = H - T - B;
    const n = labels.length;
    const x = (i: any) => L + (n === 1 ? iw / 2 : (iw * i) / (n - 1));
    const y = (v: any) => T + ih - ((v - 1) / 4) * ih;
    const kids: React.ReactNode[] = [];
    [1, 2, 3, 4, 5].forEach(g => {
      kids.push(React.createElement("line", { key: "g" + g, x1: L, x2: W - R, y1: y(g), y2: y(g), stroke: "#eceae6", strokeWidth: 1 }));
      kids.push(React.createElement("text", { key: "gt" + g, x: L - 8, y: y(g) + 4, textAnchor: "end", fontSize: 10, fill: "#a8a8a8", fontFamily: "var(--font-plex-mono),monospace" }, g));
    });
    labels.forEach((lb, i) => {
      kids.push(React.createElement("text", { key: "l" + i, x: x(i), y: H - 6, textAnchor: "middle", fontSize: 10, fill: "#a8a8a8", fontFamily: "var(--font-plex-mono),monospace" }, lb));
    });
    const seed = PULSE_LABELS.length;
    kids.unshift(React.createElement("rect", {
      key: "seedband", x: L, y: T, width: Math.max(0, x(seed - 1) - L), height: ih, fill: "#f6f4f0"
    }));
    kids.push(React.createElement("text", {
      key: "seedlabel", x: L + 6, y: T + 12, fontSize: 9, fill: "#b0aca6", fontFamily: "var(--font-plex-mono),monospace"
    }, "voorbeelddata"));
    reeksen.forEach(s => {
      const punten = s.waarden
        .map((v, i) => (v == null ? null : [x(i), y(v)]))
        .filter((p): p is number[] => p != null);
      if (punten.length > 1) {
        const gestippeld = punten.slice(0, seed);
        const massief = punten.slice(seed - 1);
        if (gestippeld.length > 1) {
          kids.push(React.createElement("polyline", {
            key: "pd" + s.key, points: gestippeld.map(p => p.join(",")).join(" "),
            fill: "none", stroke: s.kleur, strokeWidth: 2, strokeDasharray: "4 3", strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.65
          }));
        }
        if (massief.length > 1) {
          kids.push(React.createElement("polyline", {
            key: "ps" + s.key, points: massief.map(p => p.join(",")).join(" "),
            fill: "none", stroke: s.kleur, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round"
          }));
        }
      }
      punten.forEach((p, i) => {
        kids.push(React.createElement("circle", { key: "c" + s.key + i, cx: p[0], cy: p[1], r: 3.5, fill: "#fff", stroke: s.kleur, strokeWidth: 2 }));
      });
    });
    return React.createElement("svg", {
      viewBox: "0 0 " + W + " " + H, style: { width: "100%", height: "auto", display: "block", overflow: "visible" }, role: "img"
    }, kids);
  }

  avatarEl(p: Persoon, i: number, size: number) {
    if (this.state.exportAnoniem) {
      return React.createElement("div", {
        style: { width: size, height: size, borderRadius: "50%", flex: "none", background: "#eceae6", color: "#a8a8a8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4 + "px", fontWeight: 600 }
      }, "?");
    }
    if (p.foto) {
      return React.createElement("img", { src: p.foto, alt: "", style: { width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "none", display: "block" } });
    }
    return React.createElement("div", {
      style: { width: size, height: size, borderRadius: "50%", flex: "none", background: AVATAR_KLEUREN[i % AVATAR_KLEUREN.length], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34 + "px", fontWeight: 600 }
    }, init(p.naam));
  }

  downloadCsv(naam: string, rows: (string | number)[][]) {
    const csv = rows.map(r => r.map(c => String(c).replace(/;/g, ",")).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = naam; a.click();
    URL.revokeObjectURL(url);
    this.setState({ exportLabel: this.state.exportAnoniem ? "Geanonimiseerd gedownload" : "Gedownload" });
    setTimeout(() => this.setState({ exportLabel: "Exporteer CSV" }), 2200);
  }

  segTekst(n: number | null, aantal: number) {
    return aantal >= this.state.drempel ? this.fmt(n) : "n<" + this.state.drempel;
  }

  voegToe = () => {
    const { nieuwNaam, nieuwEmail } = this.state;
    if (!nieuwNaam.trim() || !nieuwEmail.includes("@")) {
      this.setState({ formMelding: "Vul een naam en een geldig e-mailadres in." });
      return;
    }
    const p = {
      id: "p" + Date.now(), naam: nieuwNaam.trim(), email: nieuwEmail.trim(),
      type: this.state.nieuwType, foto: this.state.nieuwFoto, context: this.state.nieuwContext
    };
    this.setState((s: any) => ({
      people: s.people.concat([p]),
      nieuwNaam: "", nieuwEmail: "", nieuwFoto: null,
      formMelding: p.naam.split(" ")[0] + " staat erbij. Verstuur de pulse om een link te krijgen."
    }));
  };

  kiesFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 200; c.height = 200;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const m = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, 200, 200);
        this.setState({ nieuwFoto: c.toDataURL("image/jpeg", 0.8) });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  verstuur = () => {
    this.setState({ verzendBezig: true });
    setTimeout(() => {
      const invites: Record<string, any> = Object.assign({}, this.state.invites);
      const nu = Date.now();
      this.state.people.forEach((p: any) => {
        if (Object.values(invites).some(i => i.personId === p.id)) return;
        invites[tokenize()] = { personId: p.id, vraagIds: this.kiesVragenVoor(), ingevuld: false, verstuurdOp: nu };
      });
      this.setState({ invites, verzonden: true, verzendBezig: false });
    }, 700);
  };

  openPulse = (token: string) => () => {
    const inv = this.state.invites[token];
    if (inv && inv.ingevuld) { this.setState({ screen: "pulse", actieveToken: token, pulseKlaar: true }); return; }
    this.setState({ screen: "pulse", actieveToken: token, pulseScores: {}, pulseOpenTekst: "", pulseKlaar: false });
  };

  copyLink = (token: string) => () => {
    const url = location.origin + "/pulse/" + token;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    this.setState({ gekopieerd: token });
    setTimeout(() => this.setState({ gekopieerd: null }), 1600);
  };

  verzendAntwoord = () => {
    const token = this.state.actieveToken;
    const inv = this.state.invites[token];
    if (!inv) return;
    if (Object.keys(this.state.pulseScores).length < inv.vraagIds.length) return;
    const person = this.state.people.find((p: any) => p.id === inv.personId);
    const invites: Record<string, any> = Object.assign({}, this.state.invites);
    invites[token] = Object.assign({}, inv, { ingevuld: true, ingevuldOp: Date.now() });
    this.setState((s: any) => ({
      invites,
      responses: s.responses.concat([{
        token: s.anoniem ? null : token,
        personId: person ? person.id : null,
        type: person ? person.type : "intern",
        scores: s.pulseScores,
        open: s.pulseOpenTekst.trim()
      }]),
      pulseKlaar: true,
      insights: null
    }));
  };

  genereer = () => {
    this.setState({ insightsBezig: true });
    setTimeout(() => {
      const avg = this.gemiddelde(null);
      const laagste = THEMAS.slice().filter(t => avg[t.key] != null).sort((a, b) => avg[a.key] - avg[b.key])[0];
      const hoogste = THEMAS.slice().filter(t => avg[t.key] != null).sort((a, b) => avg[b.key] - avg[a.key])[0];
      const quotes = this.state.responses.filter((r: any) => r.open).map((r: any) => r.open);
      const n = this.state.responses.length;
      this.setState({
        insightsBezig: false,
        insights: {
          samenvatting: "Deze pulse valt uiteen in twee helften: " + (laagste ? laagste.naam.toLowerCase() : "werkdruk") + " staat op " +
            this.fmt(laagste ? avg[laagste.key] : null) + " en is het enige thema dat structureel onder de rest zakt, terwijl " +
            (hoogste ? hoogste.naam.toLowerCase() : "veiligheid") + " met " + this.fmt(hoogste ? avg[hoogste.key] : null) + " de sterkste basis vormt.",
          inzichten: [
            {
              kop: "De week loopt vol voordat het werk begint",
              bewijs: (laagste ? laagste.naam : "Werkdruk") + " scoort " + this.fmt(laagste ? avg[laagste.key] : null) + " over " + n + " antwoorden; het laagste losse antwoord zit op 2.",
              actie: "Vraag in het eerstvolgende teamoverleg na welk overleg deze maand vervangen kan worden door een bericht.",
              urgentie: "hoog"
            },
            {
              kop: "Externen missen de aanleiding, niet de informatie",
              bewijs: quotes.length > 2 ? "Een extern antwoord noemt letterlijk het ontbreken van context bij gemaakte keuzes." : "Het externe segment ligt onder het interne op ontwikkeling en regie.",
              actie: "Zet bij elke besluitmail één regel 'waarom nu' en test dat twee weken bij de externe werknemers.",
              urgentie: "midden"
            },
            {
              kop: "Psychologische veiligheid is het fundament om op te bouwen",
              bewijs: (hoogste ? hoogste.naam : "Samenwerking") + " staat op " + this.fmt(hoogste ? avg[hoogste.key] : null) + ", het hoogste van de vier thema's.",
              actie: "Gebruik dat: benoem het lage werkdruk-signaal openlijk in hetzelfde overleg in plaats van er individueel op terug te komen.",
              urgentie: "laag"
            }
          ],
          citaat: quotes[0] || ""
        }
      });
    }, 900);
  };

  exportBeeld = (id: string, bestand: string, anoniem: boolean) => () => {
    const doe = () => {
      const node = document.querySelector<HTMLElement>('[data-export="' + id + '"]');
      const lib = htmlToImage;
      if (!node || !lib) { this.setState({ beeldMelding: "Beeldexport niet beschikbaar." }); return; }
      lib.toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff" }).then(url => {
        const a = document.createElement("a");
        a.href = url;
        a.download = bestand + (anoniem ? "-anoniem" : "") + "-2026-08.png";
        a.click();
        this.setState({ beeldMelding: (anoniem ? "Anoniem" : "Volledig") + " beeld gedownload." });
        setTimeout(() => this.setState({ beeldMelding: "" }), 2200);
      }).catch(() => this.setState({ beeldMelding: "Beeldexport mislukte." }));
    };
    if (anoniem === this.state.exportAnoniem) { doe(); return; }
    const terug = this.state.exportAnoniem;
    this.setState({ exportAnoniem: anoniem }, () => setTimeout(() => {
      doe();
      setTimeout(() => this.setState({ exportAnoniem: terug }), 300);
    }, 250));
  };

  exportAlleBeelden = (anoniem: boolean) => () => {
    const set = this.state.dashView === "org"
      ? [["orgThemas", "themascores-organisatie"], ["orgBetrokken", "betrokkenheid"], ["orgVerloop", "verloop-organisatie"], ["orgVerbeter", "verbeterpunten"], ["orgInzichten", "ai-inzichten"], ["orgOpen", "open-antwoorden"]]
      : [["pVerloop", "verloop-werknemer"], ["pThemas", "themascores-werknemer"], ["pAntwoorden", "antwoorden-werknemer"], ["pAdvies", "advies-werknemer"]];
    set.forEach((entry, i) => setTimeout(this.exportBeeld(entry[0], entry[1], anoniem), i * 900));
  };

  exportOrg = () => {
    const avg = this.gemiddelde(null), avgIn = this.gemiddelde("intern"), avgEx = this.gemiddelde("extern");
    const nIn = this.state.responses.filter((r: any) => r.type === "intern").length;
    const nEx = this.state.responses.filter((r: any) => r.type === "extern").length;
    const rows = [["pulse", "thema", "gemiddelde", "intern", "extern", "n", "niveau", "advies"]];
    THEMAS.forEach(t => rows.push([
      "2026-08", t.naam, this.fmt(avg[t.key]),
      nIn >= this.state.drempel ? this.fmt(avgIn[t.key]) : "n<" + this.state.drempel,
      nEx >= this.state.drempel ? this.fmt(avgEx[t.key]) : "n<" + this.state.drempel,
      this.state.responses.length, this.niveau(avg[t.key]), this.adviesVoor(t.key, avg[t.key])
    ]));
    rows.push([]);
    rows.push(["open antwoorden", this.state.exportAnoniem ? "anoniem" : "met naam"]);
    this.state.responses.filter((r: any) => r.open).forEach((r: any) => {
      const p = this.state.people.find((x: any) => x.id === r.personId);
      rows.push(["2026-08", this.state.exportAnoniem || !p ? "anoniem" : p.naam, r.type, r.open]);
    });
    this.downloadCsv("welzijnpulse-organisatie-2026-08.csv", rows);
  };

  exportPersonen = () => {
    const rows = [["pulse", "werknemer", "segment"].concat(THEMAS.map(t => t.naam)).concat(["gemiddeld", "open antwoord", "advies"])];
    this.state.people.forEach((p: any, i: any) => {
      const sc = this.persoonScores(p.id);
      const waarden = THEMAS.map(t => this.fmt(sc[t.key]));
      const geldig = THEMAS.map(t => sc[t.key]).filter(v => v != null);
      const gem = geldig.length ? geldig.reduce((a, b) => a + b, 0) / geldig.length : null;
      const laagste = THEMAS.filter(t => sc[t.key] != null).sort((a, b) => sc[a.key] - sc[b.key])[0];
      const open = this.state.responses.filter((r: any) => r.personId === p.id && r.open).map((r: any) => r.open).join(" | ");
      rows.push(["2026-08", this.naamVoor(p, i), p.type].concat(waarden).concat([
        this.fmt(gem), open || "—", laagste ? this.adviesVoor(laagste.key, sc[laagste.key]) : "geen data"
      ]));
    });
    this.downloadCsv("welzijnpulse-per-persoon-2026-08.csv", rows);
  };

  tab(name: string) {
    const on = this.state.screen === name || (name === "portaal" && this.state.screen === "pulse");
    return "border:none;cursor:pointer;border-radius:200px;padding:8px 16px;font-size:14.5px;font-weight:500;background:" +
      (on ? "#eaf6f5" : "transparent") + ";color:" + (on ? "#00857f" : "#5c5c5c");
  }

  segStyle(on: boolean) {
    return "flex:1;cursor:pointer;border-radius:200px;padding:8px 12px;font-size:13.5px;font-weight:500;border:1px solid " +
      (on ? "#00B0A8" : "#dcdad6") + ";background:" + (on ? "#eaf6f5" : "#fff") + ";color:" + (on ? "#00857f" : "#5c5c5c");
  }

  viewStyle(on: boolean) {
    return "flex:none;white-space:nowrap;cursor:pointer;border-radius:200px;padding:9px 18px;font-size:14px;font-weight:500;font-family:inherit;border:1px solid " +
      (on ? "#00B0A8" : "#dcdad6") + ";background:" + (on ? "#eaf6f5" : "#fff") + ";color:" + (on ? "#00857f" : "#5c5c5c");
  }

  toggleStyle(on: boolean) {
    return "width:44px;height:26px;border-radius:200px;border:none;cursor:pointer;padding:3px;display:flex;justify-content:" +
      (on ? "flex-end" : "flex-start") + ";background:" + (on ? "#00B0A8" : "#dcdad6");
  }

  renderVals() {
    const s = this.state;
    const invEntries = Object.keys(s.invites).map(k => Object.assign({ token: k }, s.invites[k]));
    const avgAll = this.gemiddelde(null);
    const avgIn = this.gemiddelde("intern");
    const avgEx = this.gemiddelde("extern");
    const nIn = s.responses.filter((r: any) => r.type === "intern").length;
    const nEx = s.responses.filter((r: any) => r.type === "extern").length;
    const alleVragen = VRAGEN.concat(s.eigenVragen);
    const actief = this.actieveVragen();

    const inv = s.actieveToken ? s.invites[s.actieveToken] : null;
    const invPerson = inv ? s.people.find((p: any) => p.id === inv.personId) : null;
    const pulseVragen = inv ? inv.vraagIds.map((qid: any) => {
      const v = alleVragen.find(x => x.id === qid) || { tekst: qid, t: "WD" };
      const th = THEMAS.find(t => t.key === v.t) || THEMAS[0];
      return {
        tekst: v.tekst, thema: th.naam, kleur: th.kleur,
        opties: SCHAAL.map(o => {
          const on = s.pulseScores[qid] === o.v;
          return {
            label: o.label,
            pick: () => this.setState((st: any) => ({ pulseScores: Object.assign({}, st.pulseScores, { [qid]: o.v }) })),
            style: "flex:1;cursor:pointer;border-radius:5px;padding:12px 0;font-size:16px;font-weight:600;border:1px solid " +
              (on ? "#00B0A8" : "#dcdad6") + ";background:" + (on ? "#00B0A8" : "#fff") + ";color:" + (on ? "#fff" : "#5c5c5c")
          };
        })
      };
    }) : [];
    const beantwoord = Object.keys(s.pulseScores).length;
    const volledig = inv ? beantwoord >= inv.vraagIds.length : false;

    return {
      isPortaal: s.screen === "portaal", isInstellingen: s.screen === "instellingen",
      isDashboard: s.screen === "dashboard", isPulse: s.screen === "pulse",
      goPortaal: () => this.setState({ screen: "portaal" }),
      goInstellingen: () => this.setState({ screen: "instellingen" }),
      goDashboard: () => this.setState({ screen: "dashboard" }),
      tabPortaal: this.tab("portaal"), tabInstellingen: this.tab("instellingen"), tabDashboard: this.tab("dashboard"),

      people: s.people.map((p: any, i: any) => {
        const mijn = invEntries.find(e => e.personId === p.id);
        return {
          naam: p.naam, email: p.email, type: p.type, foto: p.foto, geenFoto: !p.foto,
          fotoEl: p.foto ? React.createElement("img", { src: p.foto, alt: "", style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }) : null,
          initialen: init(p.naam),
          avatarStyle: "width:46px;height:46px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:#fff;background:" + AVATAR_KLEUREN[i % AVATAR_KLEUREN.length],
          badgeStyle: "font-family:var(--font-plex-mono),monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:200px;background:" +
            (p.type === "intern" ? "#eaf6f5" : "#fbf0e7") + ";color:" + (p.type === "intern" ? "#00857f" : "#8a4b1f"),
          status: mijn ? (mijn.ingevuld ? "ingevuld" : "uitnodiging verstuurd") : "nog niet verstuurd",
          statusKleur: mijn ? (mijn.ingevuld ? "#00857f" : "#8a8a8a") : "#b0b0b0",
          heeftLink: !!mijn,
          openPulse: mijn ? this.openPulse(mijn.token) : null,
          copyLink: mijn ? this.copyLink(mijn.token) : null,
          copyLabel: mijn && s.gekopieerd === mijn.token ? "Gekopieerd" : "Kopieer link"
        };
      }),
      nieuwNaam: s.nieuwNaam, nieuwEmail: s.nieuwEmail, nieuwFoto: s.nieuwFoto,
      nieuwFotoEl: s.nieuwFoto ? React.createElement("img", { src: s.nieuwFoto, alt: "", style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }) : null,
      setNaam: (e: any) => this.setState({ nieuwNaam: e.target.value }),
      setEmail: (e: any) => this.setState({ nieuwEmail: e.target.value }),
      kiesIntern: () => this.setState({ nieuwType: "intern" }),
      kiesExtern: () => this.setState({ nieuwType: "extern" }),
      segInternStyle: this.segStyle(s.nieuwType === "intern"),
      segExternStyle: this.segStyle(s.nieuwType === "extern"),
      kiesFoto: this.kiesFoto, voegToe: this.voegToe, formMelding: s.formMelding,
      nieuwContext: s.nieuwContext,
      setContext: (e: any) => this.setState({ nieuwContext: e.target.value }),
      contextOpties: Object.keys(CONTEXTEN).map(k => ({ key: k, label: CONTEXTEN[k].label })),
      verstuur: this.verstuur, verzonden: s.verzonden,
      verzendLabel: s.verzendBezig ? "Versturen…" : (s.verzonden ? "Opnieuw versturen" : "Verstuur naar " + s.people.length),
      verzendUitleg: s.verzonden
        ? "Iedereen heeft een eigen link met " + (s.randomiseer ? "één willekeurige vraag per thema" : "de vaste kernvraag per thema") + " en de open vraag. Pool: " + actief.length + " vragen actief."
        : "Maileroo stuurt elke werknemer een eigen token-link. De vragen worden vastgelegd op het moment van versturen.",

      dagen: DAGEN.map(d => {
        const on = s.dagen.includes(d.key);
        return {
          label: d.label,
          toggle: () => this.setState((st: any) => ({ dagen: on ? st.dagen.filter((x: any) => x !== d.key) : st.dagen.concat([d.key]) })),
          style: "width:44px;cursor:pointer;border-radius:5px;padding:7px 0;font-size:13px;font-weight:500;text-transform:uppercase;border:1px solid " +
            (on ? "#00B0A8" : "#dcdad6") + ";background:" + (on ? "#eaf6f5" : "#fff") + ";color:" + (on ? "#00857f" : "#8a8a8a")
        };
      }),
      volgendePulse: s.dagen.length
        ? (s.interval === "maandelijks" ? "14 september" : "1 oktober") + " · " +
          (s.randomDagen ? "willekeurig uit " + s.dagen.join(", ") : s.dagen.join(", "))
        : "geen dag gekozen",
      toggleRandomDagen: () => this.setState({ randomDagen: !s.randomDagen }),
      randomDagenStyle: this.toggleStyle(s.randomDagen),
      randomDagenKnop: "width:20px;height:20px;border-radius:50%;background:#fff;display:block",
      randomDagenUitleg: s.randomDagen
        ? "De pulse valt op een willekeurige van de gekozen dagen, zodat niemand erop kan anticiperen."
        : "De pulse valt op elke aangevinkte dag.",
      kiesMaand: () => this.setState({ interval: "maandelijks" }),
      kiesKwartaal: () => this.setState({ interval: "kwartaal" }),
      intMaandStyle: this.segStyle(s.interval === "maandelijks"),
      intKwartaalStyle: this.segStyle(s.interval === "kwartaal"),
      intervalUitleg: s.interval === "maandelijks"
        ? "Korte pulse: 4 vragen plus de open vraag. Dit is de demo."
        : "Zelfde code, andere config: 12 vragen over alle thema's. Verzenden gebeurt met de knop, niet met een scheduler.",
      toggleRandom: () => this.setState({ randomiseer: !s.randomiseer }),
      randomStyle: this.toggleStyle(s.randomiseer),
      randomKnop: "width:20px;height:20px;border-radius:50%;background:#fff;display:block",
      toggleAnoniem: () => this.setState({ anoniem: !s.anoniem }),
      anoniemStyle: this.toggleStyle(s.anoniem),
      anoniemKnop: "width:20px;height:20px;border-radius:50%;background:#fff;display:block",
      drempel: s.drempel,
      drempelMin: () => this.setState({ drempel: Math.max(1, s.drempel - 1) }),
      drempelPlus: () => this.setState({ drempel: Math.min(9, s.drempel + 1) }),

      poolTelling: actief.length + " van " + alleVragen.length + " actief",
      themas: THEMAS.map(t => ({
        key: t.key, naam: t.naam, kleur: t.kleur,
        telling: alleVragen.filter(v => v.t === t.key && !s.uitVragen.includes(v.id)).length + " actief",
        vragen: alleVragen.filter(v => v.t === t.key).map(v => {
          const on = !s.uitVragen.includes(v.id);
          return {
            id: v.id, tekst: v.tekst, vink: on ? "✓" : "",
            vinkStyle: "width:17px;height:17px;flex:none;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;background:" +
              (on ? t.kleur : "transparent") + ";border:1px solid " + (on ? t.kleur : "#cfcdc9"),
            style: "display:flex;align-items:center;gap:10px;width:100%;text-align:left;cursor:pointer;border:none;background:transparent;padding:6px 4px;font-size:14px;line-height:1.4;color:" +
              (on ? "#1F1F1F" : "#a8a8a8"),
            toggle: () => this.setState((st: any) => ({ uitVragen: on ? st.uitVragen.concat([v.id]) : st.uitVragen.filter((x: any) => x !== v.id) }))
          };
        })
      })),
      nieuwVraag: s.nieuwVraag, nieuwVraagThema: s.nieuwVraagThema,
      setVraag: (e: any) => this.setState({ nieuwVraag: e.target.value }),
      setVraagThema: (e: any) => this.setState({ nieuwVraagThema: e.target.value }),
      voegVraagToe: () => {
        if (!s.nieuwVraag.trim()) return;
        const id = s.nieuwVraagThema + "9" + (s.eigenVragen.length + 1);
        this.setState((st: any) => ({
          eigenVragen: st.eigenVragen.concat([{ id, t: st.nieuwVraagThema, kern: false, tekst: st.nieuwVraag.trim() }]),
          nieuwVraag: ""
        }));
      },

      pulseTitel: "Welzijnspulse · augustus",
      pulseNaam: invPerson ? invPerson.naam.split(" ")[0] : "daar",
      pulseAnoniemTekst: s.anoniem ? "Je antwoorden zijn niet aan je naam te koppelen." : "Je antwoorden zijn herleidbaar tot jouw uitnodiging.",
      pulseVragen, pulseOpen: !s.pulseKlaar, pulseKlaar: s.pulseKlaar,
      pulseVoortgang: Math.round((beantwoord / Math.max(1, pulseVragen.length)) * 100),
      pulseOpenTekst: s.pulseOpenTekst,
      setOpenTekst: (e: any) => this.setState({ pulseOpenTekst: e.target.value }),
      verzendAntwoord: this.verzendAntwoord,
      pulseVerzendLabel: volledig ? "Versturen" : "Nog " + (pulseVragen.length - beantwoord) + " vragen te gaan",
      pulseVerzendStyle: "width:100%;border:none;border-radius:200px;padding:14px;font-size:15.5px;font-weight:600;cursor:" +
        (volledig ? "pointer" : "not-allowed") + ";background:" + (volledig ? "#F5A46C" : "#f0eeea") + ";color:" + (volledig ? "#fff" : "#a8a8a8"),
      dankTekst: s.anoniem
        ? "Je antwoord is opgeslagen zonder je naam. Het telt mee in het segment " + (invPerson ? invPerson.type : "intern") + "."
        : "Je antwoord is opgeslagen. Een tweede keer invullen kan niet.",

      pulseLabel: "augustus 2026",
      responsTekst: s.responses.length + " antwoorden · " + nIn + " intern, " + nEx + " extern · drempel n=" + s.drempel,
      scores: THEMAS.map(t => ({
        naam: t.naam, kleur: t.kleur,
        score: this.fmt(avgAll[t.key]),
        pct: avgAll[t.key] ? Math.round((avgAll[t.key] / 5) * 100) : 0,
        intern: this.segTekst(avgIn[t.key], nIn),
        extern: this.segTekst(avgEx[t.key], nEx),
        delta: avgAll[t.key] != null && avgAll[t.key] < 3.2 ? "aandacht" : "stabiel",
        deltaKleur: avgAll[t.key] != null && avgAll[t.key] < 3.2 ? "#8a4b1f" : "#9a9a9a"
      })),
      genereer: this.genereer,
      genereerLabel: s.insightsBezig ? "Analyseren…" : "Genereer inzichten",
      geenInzichten: !s.insights, heeftInzichten: !!s.insights,
      samenvatting: s.insights ? s.insights.samenvatting : "",
      inzichten: s.insights ? s.insights.inzichten.map((i: any) => ({
        kop: i.kop, bewijs: i.bewijs, actie: i.actie, urgentie: i.urgentie,
        urgStyle: "font-family:var(--font-plex-mono),monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;padding:3px 7px;border-radius:200px;color:#1F1F1F;background:" +
          (i.urgentie === "hoog" ? "#F5A46C" : i.urgentie === "midden" ? "#27CFC3" : "#4a4a4a") + ";color:" + (i.urgentie === "laag" ? "#c9c9c9" : "#1F1F1F")
      })) : [],
      citaat: s.insights ? s.insights.citaat : "",
      heeftCitaat: !!(s.insights && s.insights.citaat),
      nDisclaimer: "Gebaseerd op " + s.responses.length + " antwoorden. Te weinig voor statistiek — dit toont het mechanisme, niet de uitkomst.",
      openAntwoorden: s.responses.filter((r: any) => r.open).slice().reverse().map((r: any) => ({
        tekst: r.open, bron: (s.anoniem ? "anoniem" : (r.token || "onbekend")) + " · " + r.type
      })),
      openTelling: s.responses.filter((r: any) => r.open).length + " van " + s.responses.length + " lieten iets achter",
      privacyTekst: s.anoniem
        ? "Anoniem staat aan: de token wordt na het opslaan weggegooid, alleen het segment blijft over. Segmentscores onder n=" + s.drempel + " worden verborgen."
        : "Anoniem staat uit: de token blijft aan het antwoord hangen, dus je kunt terugkijken wie wat invulde. Zeg dat vooraf tegen de werknemers.",
      isOrgView: s.dashView === "org", isPersoonView: s.dashView === "persoon",
      goOrgView: () => this.setState({ dashView: "org" }),
      goPersoonView: () => this.setState({ dashView: "persoon" }),
      viewOrgStyle: this.viewStyle(s.dashView === "org"),
      viewPersoonStyle: this.viewStyle(s.dashView === "persoon"),

      betrokken: this.betrokkenheid(),
      betrokkenNoot: "Drie reactietijden komen uit de voorbeeldreeks; " +
        (this.betrokkenheid().liveAantal || "nog geen") + " live ingevulde uitnodiging" +
        (this.betrokkenheid().liveAantal === 1 ? "" : "en") + " telt mee.",
      orgChart: this.chartEl(
        THEMAS.map(t => ({ key: t.key, kleur: t.kleur, waarden: this.orgHistorie(t.key).concat([avgAll[t.key]]) })),
        PULSE_LABELS.concat(["aug"])
      ),
      legenda: THEMAS.map(t => {
        const h = this.orgHistorie(t.key);
        const vorige = h[h.length - 1];
        const nu = avgAll[t.key];
        const d = nu != null && vorige != null ? nu - vorige : null;
        return {
          naam: t.naam, kleur: t.kleur,
          nu: this.fmt(nu),
          beweging: d == null ? "geen vergelijking" : Math.abs(d) < 0.15 ? "gelijk t.o.v. voorbeeldreeks" : (d > 0 ? "▲ " : "▼ ") + Math.abs(d).toFixed(1).replace(".", ",") + " t.o.v. juli (voorbeeld)",
          bewegingKleur: d == null ? "#9a9a9a" : Math.abs(d) < 0.15 ? "#9a9a9a" : d > 0 ? "#00857f" : "#8a4b1f"
        };
      }),

      orgAdvies: THEMAS.slice().sort((a, b) => (avgAll[a.key] == null ? 9 : avgAll[a.key]) - (avgAll[b.key] == null ? 9 : avgAll[b.key])).map((t, i) => ({
        rang: "0" + (i + 1), naam: t.naam, kleur: t.kleur,
        score: this.fmt(avgAll[t.key]),
        niveau: this.niveau(avgAll[t.key]),
        niveauStyle: "font-family:var(--font-plex-mono),monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;padding:3px 7px;border-radius:200px;background:" +
          (avgAll[t.key] != null && avgAll[t.key] < 3 ? "#fbf0e7" : "#eaf6f5") + ";color:" + this.niveauKleur(avgAll[t.key]),
        advies: this.adviesVoor(t.key, avgAll[t.key]),
        bewijsOpen: s.openBewijs === t.key,
        bewijsDicht: s.openBewijs !== t.key,
        toggleBewijs: () => this.setState({ openBewijs: s.openBewijs === t.key ? null : t.key }),
        bewijsLabel: (s.openBewijs === t.key ? "Verberg bewijs" : "Bekijk bewijs") + " (" + this.bewijsVoor(t.key).length + ")",
        bewijsStyle: "align-self:flex-start;cursor:pointer;border-radius:200px;padding:5px 12px;font-size:12.5px;font-weight:500;font-family:inherit;border:1px solid " +
          (s.openBewijs === t.key ? "#00B0A8" : "#dcdad6") + ";background:" + (s.openBewijs === t.key ? "#eaf6f5" : "#fff") +
          ";color:" + (s.openBewijs === t.key ? "#00857f" : "#5c5c5c"),
        bewijsRegels: this.bewijsVoor(t.key),
        bewijsUitleg: "Het advies volgt uit deze antwoorden op " + t.naam.toLowerCase() + " — gemiddeld " + this.fmt(avgAll[t.key]) + " over " + this.bewijsVoor(t.key).length + " antwoorden.",
        bewijsQuotes: s.responses.filter((r: any) => r.open && Object.keys(r.scores).some(q => this.themaVan(q) === t.key)).map((r: any, qi: any) => {
          const p = s.people.find((x: any) => x.id === r.personId);
          const idx = p ? s.people.indexOf(p) : qi;
          return { tekst: r.open, bron: (p ? this.naamVoor(p, idx) : "onbekend") + " · " + r.type };
        })
      })),

      personen: s.people.map((p: any, i: any) => {
        const n = s.responses.filter((r: any) => r.personId === p.id).length;
        const on = s.gekozenPersoon === p.id;
        return {
          naam: this.naamVoor(p, i),
          avatar: this.avatarEl(p, i, 34),
          sub: p.type + " · " + n + (n === 1 ? " antwoord" : " antwoorden"),
          kies: () => this.setState({ gekozenPersoon: p.id }),
          style: "display:flex;align-items:center;gap:11px;width:100%;text-align:left;cursor:pointer;border-radius:5px;padding:10px 12px;font-family:inherit;border:1px solid " +
            (on ? "#00B0A8" : "#e8e6e2") + ";background:" + (on ? "#eaf6f5" : "#fff"),
          naamStyle: "font-size:14.5px;font-weight:600;color:" + (on ? "#00857f" : "#1F1F1F"),
          subStyle: "font-size:12px;color:#8a8a8a;text-transform:none"
        };
      }),

      persoon: (() => {
        const p = s.people.find((x: any) => x.id === s.gekozenPersoon) || s.people[0];
        if (!p) return null;
        const idx = s.people.indexOf(p);
        const sc = this.persoonScores(p.id);
        const eigen = s.responses.filter((r: any) => r.personId === p.id);
        const geldig = THEMAS.map(t => sc[t.key]).filter(v => v != null);
        const gem = geldig.length ? geldig.reduce((a, b) => a + b, 0) / geldig.length : null;
        const metThema = THEMAS.filter(t => sc[t.key] != null);
        const laagste = metThema.slice().sort((a, b) => sc[a.key] - sc[b.key])[0];
        const hoogste = metThema.slice().sort((a, b) => sc[b.key] - sc[a.key])[0];
        const alleVr = VRAGEN.concat(s.eigenVragen);
        return {
          naam: this.naamVoor(p, idx),
          avatar: this.avatarEl(p, idx, 56),
          segment: p.type,
          respons: eigen.length + (eigen.length === 1 ? " antwoord" : " antwoorden"),
          gemiddeld: this.fmt(gem),
          geenData: eigen.length === 0,
          heeftData: eigen.length > 0,
          themas: THEMAS.map(t => {
            const tr = this.trendVan(p.id, t.key, sc[t.key]);
            const reeks = tr.punten.concat(sc[t.key] != null ? [sc[t.key]] : []);
            return {
              naam: t.naam, kleur: t.kleur,
              score: this.fmt(sc[t.key]),
              pct: sc[t.key] ? Math.round((sc[t.key] / 5) * 100) : 0,
              org: this.fmt(avgAll[t.key]),
              delta: sc[t.key] != null && avgAll[t.key] != null ? this.delta(sc[t.key] - avgAll[t.key]) : "geen vergelijking",
              deltaKleur: sc[t.key] != null && avgAll[t.key] != null && sc[t.key] < avgAll[t.key] ? "#8a4b1f" : "#00857f",
              niveau: this.niveau(sc[t.key]),
              trend: tr.tekst, trendKleur: tr.kleur,
              reeks: reeks.map((v, ri) => ({
                label: PULSE_LABELS[ri] || "aug",
                waarde: this.fmt(v),
                style: "width:100%;border-radius:2px 2px 0 0;background:" + (ri === reeks.length - 1 ? t.kleur : "#dfe6e3") +
                  ";height:" + Math.max(6, Math.round((v / 5) * 46)) + "px"
              }))
            };
          }),
          antwoorden: eigen.length ? ([] as any[]).concat(...eigen.map((r: any) => Object.keys(r.scores).map(qid => {
            const v = alleVr.find(x => x.id === qid) || { tekst: qid, t: "WD" };
            const th = THEMAS.find(x => x.key === v.t) || THEMAS[0];
            const sv = r.scores[qid];
            return {
              vraag: v.tekst, thema: th.naam, kleur: th.kleur, id: qid, score: sv,
              scoreStyle: "font-family:var(--font-plex-mono),monospace;font-size:13px;font-weight:500;padding:3px 9px;border-radius:200px;background:" +
                (sv <= 2 ? "#fbf0e7" : sv === 3 ? "#f3f1ec" : "#eaf6f5") + ";color:" + (sv <= 2 ? "#8a4b1f" : sv === 3 ? "#5c5c5c" : "#00857f")
            };
          }))) : [],
          chart: this.chartEl(
            THEMAS.map(t => ({ key: t.key, kleur: t.kleur, waarden: ((HISTORIE[p.id] || {})[t.key] || [null, null, null]).concat([sc[t.key]]) })),
            PULSE_LABELS.concat(["aug"])
          ),
          ctxLabel: (CONTEXTEN[p.context] || CONTEXTEN.geen).label,
          ctxKort: (CONTEXTEN[p.context] || CONTEXTEN.geen).kort,
          ctxLees: (CONTEXTEN[p.context] || CONTEXTEN.geen).lees,
          ctxHelpt: (CONTEXTEN[p.context] || CONTEXTEN.geen).helpt.map(h => ({ tekst: h })),
          ctxValkuil: (CONTEXTEN[p.context] || CONTEXTEN.geen).valkuil,
          notities: (s.notities[p.id] || []).map((n: any, ni: any) => ({
            tekst: n.tekst, datum: n.datum,
            verwijder: () => this.setState((st: any) => {
              const kopie = Object.assign({}, st.notities);
              kopie[p.id] = (kopie[p.id] || []).filter((_: any, i: any) => i !== ni);
              return { notities: kopie };
            })
          })),
          geenNotities: (s.notities[p.id] || []).length === 0,
          heeftContext: !!(p.context && p.context !== "geen"),
          geenContext: !p.context || p.context === "geen",
          quotes: eigen.filter((r: any) => r.open).map((r: any) => ({ tekst: r.open })),
          geenQuote: eigen.filter((r: any) => r.open).length === 0,
          focusThema: laagste ? laagste.naam : "—",
          focusAdvies: laagste ? this.adviesVoor(laagste.key, sc[laagste.key]) : "Nog geen antwoorden van deze werknemer.",
          krachtThema: hoogste ? hoogste.naam : "—",
          krachtAdvies: hoogste ? this.adviesVoor(hoogste.key, sc[hoogste.key]) : "—"
        };
      })(),

      nieuweNotitie: s.nieuweNotitie,
      setNotitie: (e: any) => this.setState({ nieuweNotitie: e.target.value }),
      bewaarNotitie: () => {
        const tekst = s.nieuweNotitie.trim();
        if (!tekst) return;
        const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
        this.setState((st: any) => {
          const kopie = Object.assign({}, st.notities);
          kopie[st.gekozenPersoon] = (kopie[st.gekozenPersoon] || []).concat([{ tekst, datum }]);
          return { notities: kopie, nieuweNotitie: "" };
        });
      },
      bewaarStyle: "border:none;border-radius:200px;padding:9px 18px;font-size:14px;font-weight:500;font-family:inherit;cursor:" +
        (s.nieuweNotitie.trim() ? "pointer" : "not-allowed") + ";background:" + (s.nieuweNotitie.trim() ? "#00B0A8" : "#f0eeea") +
        ";color:" + (s.nieuweNotitie.trim() ? "#fff" : "#a8a8a8"),
      beeldMelding: s.beeldMelding || "",
      heeftBeeldMelding: !!s.beeldMelding,
      beeld: {
        orgVerloopN: this.exportBeeld("orgVerloop", "verloop-organisatie", false),
        orgVerloopA: this.exportBeeld("orgVerloop", "verloop-organisatie", true),
        orgThemasN: this.exportBeeld("orgThemas", "themascores-organisatie", false),
        orgThemasA: this.exportBeeld("orgThemas", "themascores-organisatie", true),
        orgVerbeterN: this.exportBeeld("orgVerbeter", "verbeterpunten", false),
        orgVerbeterA: this.exportBeeld("orgVerbeter", "verbeterpunten", true),
        orgInzichtenN: this.exportBeeld("orgInzichten", "ai-inzichten", false),
        orgInzichtenA: this.exportBeeld("orgInzichten", "ai-inzichten", true),
        orgBetrokkenN: this.exportBeeld("orgBetrokken", "betrokkenheid", false),
        orgBetrokkenA: this.exportBeeld("orgBetrokken", "betrokkenheid", true),
        orgOpenN: this.exportBeeld("orgOpen", "open-antwoorden", false),
        orgOpenA: this.exportBeeld("orgOpen", "open-antwoorden", true),
        pVerloopN: this.exportBeeld("pVerloop", "verloop-werknemer", false),
        pVerloopA: this.exportBeeld("pVerloop", "verloop-werknemer", true),
        pThemasN: this.exportBeeld("pThemas", "themascores-werknemer", false),
        pThemasA: this.exportBeeld("pThemas", "themascores-werknemer", true),
        pAntwoordenN: this.exportBeeld("pAntwoorden", "antwoorden-werknemer", false),
        pAntwoordenA: this.exportBeeld("pAntwoorden", "antwoorden-werknemer", true),
        pAdviesN: this.exportBeeld("pAdvies", "advies-werknemer", false),
        pAdviesA: this.exportBeeld("pAdvies", "advies-werknemer", true),
        alleN: this.exportAlleBeelden(false),
        alleA: this.exportAlleBeelden(true)
      },
      exportOrg: this.exportOrg, exportPersonen: this.exportPersonen,
      exportLabel: s.exportLabel,
      exportHuidig: s.dashView === "org" ? this.exportOrg : this.exportPersonen,
      exportHuidigLabel: s.exportLabel === "Exporteer CSV"
        ? (s.dashView === "org" ? "Exporteer organisatie" : "Exporteer per persoon")
        : s.exportLabel,
      toggleExportAnoniem: () => this.setState({ exportAnoniem: !s.exportAnoniem }),
      exportAnoniemStyle: this.toggleStyle(s.exportAnoniem),
      exportAnoniemKnop: "width:20px;height:20px;border-radius:50%;background:#fff;display:block",
      exportAnoniemTekst: s.exportAnoniem
        ? "Namen en foto's worden vervangen door Werknemer 1, 2, 3 — in het scherm én in de export."
        : "Namen staan in het scherm en in de export."
    };
  }

  render() {
    return (
      <>
        <style>{hoverCss}</style>
        {renderView(this.renderVals())}
      </>
    );
  }
}
