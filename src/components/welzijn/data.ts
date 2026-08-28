/**
 * Static content of the welzijn pulse: themes, the question pool, the advice
 * per theme, the context profiles and the example history the demo charts.
 *
 * Ported verbatim from the Welzijn Portaal design; the wording is the design's.
 */

export type Thema = { key: string; naam: string; kleur: string };
export type Vraag = { id: string; t: string; kern: boolean; tekst: string };
export type Context = {
  label: string;
  kort: string;
  lees: string;
  helpt: string[];
  valkuil: string;
};


export const THEMAS: Thema[] = [
  { key: "WD", naam: "Werkdruk & balans", kleur: "#00B0A8" },
  { key: "OR", naam: "Ontwikkeling & regie", kleur: "#27CFC3" },
  { key: "SV", naam: "Samenwerking & veiligheid", kleur: "#F5A46C" },
  { key: "WZ", naam: "Waardering & zingeving", kleur: "#8a9a5b" }
];

export const VRAGEN: Vraag[] = [
  { id: "WD01", t: "WD", kern: true,  tekst: "Ik krijg mijn werk af binnen mijn werktijd." },
  { id: "WD02", t: "WD", kern: false, tekst: "Na een werkdag heb ik genoeg energie voor mijn eigen leven." },
  { id: "WD03", t: "WD", kern: false, tekst: "De verdeling van het werk in mijn team voelt eerlijk." },
  { id: "WD04", t: "WD", kern: false, tekst: "Ik kan pauze nemen wanneer ik dat nodig heb." },
  { id: "WD05", t: "WD", kern: false, tekst: "Het tempo van mijn werk is de afgelopen weken houdbaar geweest." },
  { id: "WD06", t: "WD", kern: false, tekst: "Ik kan mijn werk loslaten als ik vrij ben." },
  { id: "WD07", t: "WD", kern: false, tekst: "Onverwachte klussen kan ik opvangen zonder dat de rest blijft liggen." },
  { id: "WD08", t: "WD", kern: false, tekst: "Ik heb genoeg tijd om mijn werk zorgvuldig te doen." },
  { id: "WD09", t: "WD", kern: false, tekst: "Overleggen kosten mij niet meer tijd dan ze opleveren." },
  { id: "WD10", t: "WD", kern: false, tekst: "Ik weet wat er van mij verwacht wordt in een week." },
  { id: "WD11", t: "WD", kern: false, tekst: "Als het te veel wordt, kan ik dat op tijd aangeven." },
  { id: "WD12", t: "WD", kern: false, tekst: "Mijn werkplek helpt mij om me te concentreren." },
  { id: "WD13", t: "WD", kern: false, tekst: "Ik word buiten werktijd niet gestoord door werk." },
  { id: "WD14", t: "WD", kern: false, tekst: "Ik slaap goed in werkweken." },

  { id: "OR01", t: "OR", kern: true,  tekst: "Ik bepaal zelf hoe ik mijn werk aanpak." },
  { id: "OR02", t: "OR", kern: false, tekst: "Ik leer in dit werk dingen die ik wil leren." },
  { id: "OR03", t: "OR", kern: false, tekst: "Ik weet wat de volgende stap in mijn ontwikkeling is." },
  { id: "OR04", t: "OR", kern: false, tekst: "Als ik iets wil veranderen aan mijn werk, kan dat." },
  { id: "OR05", t: "OR", kern: false, tekst: "Ik kan mijn eigen werkdag indelen." },
  { id: "OR06", t: "OR", kern: false, tekst: "Mijn talenten worden hier gebruikt." },
  { id: "OR07", t: "OR", kern: false, tekst: "Ik krijg de ruimte om iets nieuws te proberen." },
  { id: "OR08", t: "OR", kern: false, tekst: "Ik heb genoeg begeleiding om te groeien in mijn rol." },
  { id: "OR09", t: "OR", kern: false, tekst: "Ik word betrokken bij beslissingen die mijn werk raken." },
  { id: "OR10", t: "OR", kern: false, tekst: "Ik heb de middelen en toegang die ik nodig heb om te werken." },
  { id: "OR11", t: "OR", kern: false, tekst: "Ik weet hoe mijn werk bijdraagt aan het geheel." },
  { id: "OR12", t: "OR", kern: false, tekst: "Ik kan aangeven welk werk beter bij mij past." },
  { id: "OR13", t: "OR", kern: false, tekst: "Er is tijd om te leren, niet alleen om te leveren." },
  { id: "OR14", t: "OR", kern: false, tekst: "Ik voel me eigenaar van mijn eigen resultaten." },

  { id: "SV01", t: "SV", kern: true,  tekst: "Ik durf het te zeggen als ik iets niet weet." },
  { id: "SV02", t: "SV", kern: false, tekst: "Ik weet bij wie ik terecht kan als het niet lukt." },
  { id: "SV03", t: "SV", kern: false, tekst: "Fouten worden hier gebruikt om te leren, niet om af te rekenen." },
  { id: "SV04", t: "SV", kern: false, tekst: "Ik voel me thuis bij de mensen met wie ik samenwerk." },
  { id: "SV05", t: "SV", kern: false, tekst: "Ik kan het oneens zijn met mijn leidinggevende zonder gevolgen." },
  { id: "SV06", t: "SV", kern: false, tekst: "Er wordt naar mij geluisterd in overleggen." },
  { id: "SV07", t: "SV", kern: false, tekst: "Afspraken die we maken worden nagekomen." },
  { id: "SV08", t: "SV", kern: false, tekst: "Ik kan om hulp vragen zonder me te verantwoorden." },
  { id: "SV09", t: "SV", kern: false, tekst: "Ik weet wat er speelt in de organisatie." },
  { id: "SV10", t: "SV", kern: false, tekst: "Nieuwe mensen worden hier goed opgevangen." },
  { id: "SV11", t: "SV", kern: false, tekst: "Ongewenst gedrag wordt hier aangesproken." },
  { id: "SV12", t: "SV", kern: false, tekst: "Ik kan mezelf zijn op het werk." },
  { id: "SV13", t: "SV", kern: false, tekst: "De samenwerking met andere teams loopt soepel." },
  { id: "SV14", t: "SV", kern: false, tekst: "Ik vertrouw erop dat mijn collega's hun deel doen." },

  { id: "WZ01", t: "WZ", kern: true,  tekst: "Ik merk dat mijn werk verschil maakt." },
  { id: "WZ02", t: "WZ", kern: false, tekst: "Ik krijg te horen wanneer iets goed gaat." },
  { id: "WZ03", t: "WZ", kern: false, tekst: "Mijn werk past bij wat ik belangrijk vind." },
  { id: "WZ04", t: "WZ", kern: false, tekst: "Ik zie mezelf hier over een jaar nog werken." },
  { id: "WZ05", t: "WZ", kern: false, tekst: "Ik voel me gewaardeerd om wat ik doe." },
  { id: "WZ06", t: "WZ", kern: false, tekst: "Ik ben trots als ik vertel waar ik werk." },
  { id: "WZ07", t: "WZ", kern: false, tekst: "Ik zie het resultaat van mijn werk terug." },
  { id: "WZ08", t: "WZ", kern: false, tekst: "De beloning voelt eerlijk voor wat ik doe." },
  { id: "WZ09", t: "WZ", kern: false, tekst: "Wat wij hier doen doet ertoe voor de mensen om ons heen." },
  { id: "WZ10", t: "WZ", kern: false, tekst: "Ik krijg bruikbare feedback op mijn werk." },
  { id: "WZ11", t: "WZ", kern: false, tekst: "Ik kijk met plezier uit naar mijn werkdag." },
  { id: "WZ12", t: "WZ", kern: false, tekst: "Mijn inbreng wordt serieus genomen." },
  { id: "WZ13", t: "WZ", kern: false, tekst: "Ik voel me verbonden met waar deze organisatie voor staat." },
  { id: "WZ14", t: "WZ", kern: false, tekst: "Aan het eind van de week heb ik het gevoel iets afgemaakt te hebben." }
];

export const SCHAAL = [
  { v: 1, label: "1" }, { v: 2, label: "2" }, { v: 3, label: "3" }, { v: 4, label: "4" }, { v: 5, label: "5" }
];

export const DAGEN = [
  { key: "ma", label: "ma" }, { key: "di", label: "di" }, { key: "wo", label: "wo" },
  { key: "do", label: "do" }, { key: "vr", label: "vr" },
  { key: "za", label: "za" }, { key: "zo", label: "zo" }
];

export const ADVIES: Record<string, { laag: string; midden: string; hoog: string }> = {
  WD: {
    laag: "Snijd deze maand één terugkerend overleg weg en geef die tijd terug als blokuur zonder agenda.",
    midden: "Laat het team zelf benoemen welke twee taken deze maand mogen wachten, en bekrachtig die keuze hardop.",
    hoog: "Houd het huidige tempo vast en leg vast wat het rustig houdt, zodat het een piek overleeft."
  },
  OR: {
    laag: "Plan per persoon een half uur over één concrete volgende stap — geen ontwikkelplan, één stap.",
    midden: "Geef iedereen deze maand één keuze terug: welk werk je oppakt, of hoe je het aanpakt.",
    hoog: "Gebruik de ruimte die er is: laat iemand een klus leiden die net boven zijn niveau ligt."
  },
  SV: {
    laag: "Open het eerstvolgende overleg zelf met iets wat niet lukte. Veiligheid begint bij wie de macht heeft.",
    midden: "Vraag expliciet naar tegenspraak in besluiten en noteer die zichtbaar in de notulen.",
    hoog: "Benut het vertrouwen: bespreek het lastigste signaal uit deze pulse in de groep, niet één op één."
  },
  WZ: {
    laag: "Koppel deze week bij drie mensen terug wat hun werk concreet heeft opgeleverd, met een voorbeeld.",
    midden: "Maak resultaat zichtbaar: sluit de week af met wat er af is, niet met wat er nog moet.",
    hoog: "Laat mensen zelf vertellen waar ze trots op zijn; gebruik dat als verhaal naar buiten."
  }
};

export const CONTEXTEN: Record<string, Context> = {
  geen: { label: "Geen context gedeeld", kort: "—", lees: "Lees de scores zoals ze er staan.", helpt: [], valkuil: "" },
  adhd: {
    label: "ADHD",
    kort: "Werkt in pieken, verliest tijd in het schakelen",
    lees: "Een lage werkdrukscore zegt hier vaak meer over versnippering dan over hoeveelheid werk.",
    helpt: [
      "Eén prioriteit per dag, hardop bevestigd — niet een lijst van vijf.",
      "Vergaderingen bundelen zodat er hele blokken overblijven in plaats van gaten.",
      "Deadlines in stappen knippen, met een kort check-in halverwege."
    ],
    valkuil: "Extra structuur van bovenaf voelt snel als controle. Laat de werknemer zelf kiezen welke structuur helpt."
  },
  autisme: {
    label: "Autisme / hoogbegaafdheid",
    kort: "Sterk op inhoud, gevoelig voor onvoorspelbaarheid",
    lees: "Een hoge inhoudsscore naast een lage samenwerkingsscore duidt meestal op onduidelijke verwachtingen, niet op onwil.",
    helpt: [
      "Agenda en doel van een overleg vooraf op papier, ook als het informeel is.",
      "Wijzigingen aankondigen in plaats van improviseren — ook kleine.",
      "Ruimte voor diepgang: één klus waar de lat echt hoog ligt weegt op tegen tien losse taakjes."
    ],
    valkuil: "Prikkels en spontane overleggen kosten hier meer energie dan het werk zelf."
  },
  bipolair: {
    label: "Manisch-depressieve stemmingswisseling",
    kort: "Energie beweegt in golven, over weken",
    lees: "Kijk hier naar het verloop over meerdere pulses, niet naar één meting: de richting zegt meer dan de score.",
    helpt: [
      "Vaste afspraken over wat er gebeurt bij een dip én bij een piek, gemaakt in een rustige periode.",
      "Werkdruk begrenzen in goede weken — een piek nu is vaak een dip later.",
      "Één vast aanspreekpunt dat het patroon kent, zodat het verhaal niet elke keer opnieuw begint."
    ],
    valkuil: "Een sterke pulse betekent niet dat de afspraken losgelaten kunnen worden."
  }
};

export const PULSE_LABELS = ["mei", "juni", "juli"];

export const HISTORIE: Record<string, Record<string, number[]>> = {
  p1: { WD: [3.4, 3.0, 2.6], OR: [3.6, 3.8, 3.9], SV: [4.0, 4.1, 4.0], WZ: [3.8, 3.9, 4.0] },
  p2: { WD: [2.8, 3.0, 3.1], OR: [3.4, 3.2, 3.0], SV: [4.4, 4.6, 4.8], WZ: [4.6, 4.8, 4.9] },
  p3: { WD: [3.2, 3.1, 3.0], OR: [2.8, 2.6, 2.3], SV: [3.6, 3.8, 4.0], WZ: [3.9, 4.0, 4.1] }
};

export const AVATAR_KLEUREN = ["#00B0A8", "#F5A46C", "#27CFC3", "#8a9a5b", "#1F1F1F"];

export const LEEG_PX = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function tokenize() { return Math.random().toString(36).slice(2, 8); }
export function init(n: string) { return n.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(""); }


/**
 * A row from np_questions as the portal wants it. The code is the id here:
 * every score, chart and export in the portal is keyed on it.
 */
export function vraagVanRij(row: {
  code: string;
  theme: string;
  text: string;
  kind: string;
}): Vraag {
  return { id: row.code, t: row.theme, kern: row.kind === "kern", tekst: row.text };
}
