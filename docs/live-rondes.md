# Rondes met de hand versturen, live meekijken

De korte route naar een werkende ronde: geen mailtemplate, geen verzendvenster,
geen DNS. Je opent een ronde, kopieert de links, stuurt ze zelf, en kijkt mee
terwijl de antwoorden binnenkomen.

## Hoe het werkt

1. **`/beheer`** — vul het pulse-secret in, kies *flitspulse* (5 vragen) of
   *dieptepulse* (12 vragen), klik **Ronde openen**.
   Je krijgt per persoon één link terug, plus de dashboardlink. Je kunt per
   persoon zien welke vragen die persoon krijgt.
2. **Stuur de links met de hand.** WhatsApp, mail, Signal — het maakt niet uit.
   De link is de identiteit; er is geen account en geen wachtwoord.
3. **`/vragen/[token]`** — de deelnemer beantwoordt één vraag per scherm.
4. **`/live/[pulse]`** — het dashboard ververst elke drie seconden: de
   responsgraad, de verdeling per thema, de binnengekomen antwoorden, de
   inzichten, en het spoor van wat elk nieuw antwoord veranderde.

## De vragen

| | flits | diepte |
|---|---|---|
| Gescoorde vragen | 4 | 11 |
| Open vraag | 1 | 1 |
| **Totaal** | **5** | **12** |

De trekking is per persoon en gestratificeerd over de vier thema's: een flits
raakt elk thema één keer, een diepte verdeelt 11 vragen als 3/3/3/2 (welk thema
er één mist, is onderdeel van de trekking). Twee mensen in dezelfde ronde
krijgen dus verschillende vragen.

De trekking is **geseed op het token**, niet op de klok. Dezelfde link toont
altijd dezelfde vragen in dezelfde volgorde — ook als hij half ingevuld wordt
weggeklikt en later opnieuw geopend — en dat is wat de bevroren
`np_invites.question_ids` en het formulier gelijk houdt.

## Live, en wat dat kost

Elk antwoord herberekent Layer A (pure functies, geen model) en vraagt één
keer de leeslaag om inzichten. Dat resultaat wordt bewaard per *aantal
antwoorden*, dus:

- het dashboard mag elke drie seconden pollen zonder een modelaanroep te doen;
- elke hercalculatie wordt een **nieuwe versie**, nooit een overschrijving.

Dat versiespoor is de demo. Zien dat een inzicht hard omslaat tussen antwoord 2
en antwoord 3 is het overtuigendste argument voor waarom vier antwoorden geen
urgente conclusie kunnen dragen — dus verbergen we die uitslag niet, we tonen
hem met de reden erbij.

## Waar dit afwijkt van `data-pipeline-plan.md`

Bewust, en met de reden erbij:

- **Eén modelaanroep in plaats van twee.** Het plan (§4–5) scheidt het coderen
  van de open tekst van het schrijven van het inzicht. Bij vier open zinnen
  koopt die tweede aanroep structuur die niemand ziet, terwijl het dashboard bij
  élk antwoord opnieuw leest. Wat de splitsing beschermde, blijft staan waar het
  telt: de validator laat geen getal door dat niet uit Layer A herleidbaar is.
- **Geen ankervragen.** §9 punt 4 noemt een vaste ankerset het meest
  waardevolle dat je kunt doen voor trendkwaliteit. Dat klopt nog steeds, en
  het staat hier niet in: deze ronde is bewust volledig willekeurig getrokken.
  Zolang dat zo is, zijn twee rondes niet zonder meer met elkaar te vergelijken.
- **Geen bootstrap-intervallen.** Layer A rapporteert aantallen en verdelingen.
  Bij vier antwoorden is een betrouwbaarheidsinterval breder dan de schaal.

## Anonimiteit, en de eerlijke waarschuwing

`np_responses.invite_id` wordt genuld zodra de antwoorden zijn weggeschreven;
alleen `segment` blijft staan. Maar een dashboard dat meebeweegt terwijl de
ronde openstaat, is bij vijf mensen **de-anonimiserend**: wie ziet dat het beeld
om 14:03 verspringt, weet wie er net heeft ingevuld. Dat is geen drempel die je
met een hogere `threshold_n` repareert.

Daarom staat de modus als tekst op het scherm — *"Demoweergave — drempel uit,
losse antwoorden zichtbaar. Niet gebruiken bij een echte ronde."* Bij echte
medewerkers is de enige eerlijke live-weergave een teller: *"4 van de 12
binnen"*, zonder scores, zonder teksten, zonder inzichten, tot de ronde dicht is.

## Wat er in de omgeving moet staan

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PULSE_ADMIN_SECRET` (of het
bestaande `PULSE_TEST_SECRET`) en `NEXT_PUBLIC_BASE_URL`. `OPENROUTER_API_KEY`
en `OPENROUTER_MODEL` zijn optioneel: zonder die twee blijft alles werken,
alleen de inzichtkaart zegt dan waarom hij leeg is. De cijfers hebben geen
model nodig.
