-- Numbers Welzijn Portaal — de vragenpool en de labelkolom.
--
-- Twee dingen die de app nodig heeft zodra het portaal echt schrijft:
--
--  1. np_people.labels. Staat al in het live project (ref wtkgbrwhkwmlqkcfkmqz)
--     maar niet in de migratie ernaast, dus een vers project miste hem.
--     Zelf verklaarde labels, art. 9 AVG: alleen wat iemand zelf invult.
--
--  2. De 56 ingebouwde vragen. /api/questions kiest de code voor een eigen
--     vraag als het laagste vrije nummer in het thema; staat WD01 niet in de
--     tabel, dan krijgt de eerste eigen vraag WD01 en botst hij in het portaal
--     met de ingebouwde WD01.
--
-- Beide idempotent: opnieuw draaien verandert niets.

alter table np_people
  add column if not exists labels text[] not null default '{}'::text[];

insert into np_questions (code, theme, text, kind, is_builtin, sort_order) values
  ('WD01', 'WD', 'Ik krijg mijn werk af binnen mijn werktijd.', 'kern', true, 1),
  ('WD02', 'WD', 'Na een werkdag heb ik genoeg energie voor mijn eigen leven.', 'verdieping', true, 2),
  ('WD03', 'WD', 'De verdeling van het werk in mijn team voelt eerlijk.', 'verdieping', true, 3),
  ('WD04', 'WD', 'Ik kan pauze nemen wanneer ik dat nodig heb.', 'verdieping', true, 4),
  ('WD05', 'WD', 'Het tempo van mijn werk is de afgelopen weken houdbaar geweest.', 'verdieping', true, 5),
  ('WD06', 'WD', 'Ik kan mijn werk loslaten als ik vrij ben.', 'verdieping', true, 6),
  ('WD07', 'WD', 'Onverwachte klussen kan ik opvangen zonder dat de rest blijft liggen.', 'verdieping', true, 7),
  ('WD08', 'WD', 'Ik heb genoeg tijd om mijn werk zorgvuldig te doen.', 'verdieping', true, 8),
  ('WD09', 'WD', 'Overleggen kosten mij niet meer tijd dan ze opleveren.', 'verdieping', true, 9),
  ('WD10', 'WD', 'Ik weet wat er van mij verwacht wordt in een week.', 'verdieping', true, 10),
  ('WD11', 'WD', 'Als het te veel wordt, kan ik dat op tijd aangeven.', 'verdieping', true, 11),
  ('WD12', 'WD', 'Mijn werkplek helpt mij om me te concentreren.', 'verdieping', true, 12),
  ('WD13', 'WD', 'Ik word buiten werktijd niet gestoord door werk.', 'verdieping', true, 13),
  ('WD14', 'WD', 'Ik slaap goed in werkweken.', 'verdieping', true, 14),
  ('OR01', 'OR', 'Ik bepaal zelf hoe ik mijn werk aanpak.', 'kern', true, 1),
  ('OR02', 'OR', 'Ik leer in dit werk dingen die ik wil leren.', 'verdieping', true, 2),
  ('OR03', 'OR', 'Ik weet wat de volgende stap in mijn ontwikkeling is.', 'verdieping', true, 3),
  ('OR04', 'OR', 'Als ik iets wil veranderen aan mijn werk, kan dat.', 'verdieping', true, 4),
  ('OR05', 'OR', 'Ik kan mijn eigen werkdag indelen.', 'verdieping', true, 5),
  ('OR06', 'OR', 'Mijn talenten worden hier gebruikt.', 'verdieping', true, 6),
  ('OR07', 'OR', 'Ik krijg de ruimte om iets nieuws te proberen.', 'verdieping', true, 7),
  ('OR08', 'OR', 'Ik heb genoeg begeleiding om te groeien in mijn rol.', 'verdieping', true, 8),
  ('OR09', 'OR', 'Ik word betrokken bij beslissingen die mijn werk raken.', 'verdieping', true, 9),
  ('OR10', 'OR', 'Ik heb de middelen en toegang die ik nodig heb om te werken.', 'verdieping', true, 10),
  ('OR11', 'OR', 'Ik weet hoe mijn werk bijdraagt aan het geheel.', 'verdieping', true, 11),
  ('OR12', 'OR', 'Ik kan aangeven welk werk beter bij mij past.', 'verdieping', true, 12),
  ('OR13', 'OR', 'Er is tijd om te leren, niet alleen om te leveren.', 'verdieping', true, 13),
  ('OR14', 'OR', 'Ik voel me eigenaar van mijn eigen resultaten.', 'verdieping', true, 14),
  ('SV01', 'SV', 'Ik durf het te zeggen als ik iets niet weet.', 'kern', true, 1),
  ('SV02', 'SV', 'Ik weet bij wie ik terecht kan als het niet lukt.', 'verdieping', true, 2),
  ('SV03', 'SV', 'Fouten worden hier gebruikt om te leren, niet om af te rekenen.', 'verdieping', true, 3),
  ('SV04', 'SV', 'Ik voel me thuis bij de mensen met wie ik samenwerk.', 'verdieping', true, 4),
  ('SV05', 'SV', 'Ik kan het oneens zijn met mijn leidinggevende zonder gevolgen.', 'verdieping', true, 5),
  ('SV06', 'SV', 'Er wordt naar mij geluisterd in overleggen.', 'verdieping', true, 6),
  ('SV07', 'SV', 'Afspraken die we maken worden nagekomen.', 'verdieping', true, 7),
  ('SV08', 'SV', 'Ik kan om hulp vragen zonder me te verantwoorden.', 'verdieping', true, 8),
  ('SV09', 'SV', 'Ik weet wat er speelt in de organisatie.', 'verdieping', true, 9),
  ('SV10', 'SV', 'Nieuwe mensen worden hier goed opgevangen.', 'verdieping', true, 10),
  ('SV11', 'SV', 'Ongewenst gedrag wordt hier aangesproken.', 'verdieping', true, 11),
  ('SV12', 'SV', 'Ik kan mezelf zijn op het werk.', 'verdieping', true, 12),
  ('SV13', 'SV', 'De samenwerking met andere teams loopt soepel.', 'verdieping', true, 13),
  ('SV14', 'SV', 'Ik vertrouw erop dat mijn collega''s hun deel doen.', 'verdieping', true, 14),
  ('WZ01', 'WZ', 'Ik merk dat mijn werk verschil maakt.', 'kern', true, 1),
  ('WZ02', 'WZ', 'Ik krijg te horen wanneer iets goed gaat.', 'verdieping', true, 2),
  ('WZ03', 'WZ', 'Mijn werk past bij wat ik belangrijk vind.', 'verdieping', true, 3),
  ('WZ04', 'WZ', 'Ik zie mezelf hier over een jaar nog werken.', 'verdieping', true, 4),
  ('WZ05', 'WZ', 'Ik voel me gewaardeerd om wat ik doe.', 'verdieping', true, 5),
  ('WZ06', 'WZ', 'Ik ben trots als ik vertel waar ik werk.', 'verdieping', true, 6),
  ('WZ07', 'WZ', 'Ik zie het resultaat van mijn werk terug.', 'verdieping', true, 7),
  ('WZ08', 'WZ', 'De beloning voelt eerlijk voor wat ik doe.', 'verdieping', true, 8),
  ('WZ09', 'WZ', 'Wat wij hier doen doet ertoe voor de mensen om ons heen.', 'verdieping', true, 9),
  ('WZ10', 'WZ', 'Ik krijg bruikbare feedback op mijn werk.', 'verdieping', true, 10),
  ('WZ11', 'WZ', 'Ik kijk met plezier uit naar mijn werkdag.', 'verdieping', true, 11),
  ('WZ12', 'WZ', 'Mijn inbreng wordt serieus genomen.', 'verdieping', true, 12),
  ('WZ13', 'WZ', 'Ik voel me verbonden met waar deze organisatie voor staat.', 'verdieping', true, 13),
  ('WZ14', 'WZ', 'Aan het eind van de week heb ik het gevoel iets afgemaakt te hebben.', 'verdieping', true, 14)
on conflict (code) do nothing;
