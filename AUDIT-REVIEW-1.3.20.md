# GARP review — Diferenciátor 1.3.20 RC

Datum: 2026-08-14

## Rozsah
Review této verze se soustředí na Fázi 1 univerzální podpory obrazově klíčových podkladů: slepé mapy, grafy, schémata, geometrické nákresy, biologické obrázky a obdobné vizuální části úloh.

## Potvrzené změny
- Vizuální obsah je veden jako samostatný asset s identitou `VISUAL_n`, rolí, typem a učitelským režimem použití.
- Učitel může zachovat obraz ve výstupu, použít jej jen jako multimodální referenci nebo jej ignorovat.
- Fotografie celé stránky lze lokálně oříznout; tento krok nepoužívá AI.
- Zachované assety nejsou závislé na tom, zda model věrně přepíše obrázek do textu. Model dostává image vstup a marker umístění, aplikace používá uložená obrazová data.
- Výsledek, tiskový náhled a projekt používají tentýž uložený asset; kontrola kvality, revize a řešení jej dostávají jako image kontext.
- Manifest operací i runtime Core konfigurace dovolují image vstup pro worksheet generation, quality audit/revision a answer-key generation.
- DOCX zpracuje podporované vložené rastrové formáty a SVG rasterizuje; nepodporovaný formát hlásí učiteli.
- Statická regresní brána T16 a `qa:visuals` chrání vizuální tok před návratem k čistě textové architektuře.

## Regresní výsledky
- `npm test`: PASS; 121/121 interních testů.
- GHRAB Platform: 109/109.
- Model profiles: 17/17.
- `qa:visuals` Direct Gemini: PASS.
- `qa:visuals:school` School Gateway: PASS.
- `qa:quality`: 31/31.
- `qa:browser`: PASS.
- `qa:xss`: PASS; HTML sinky nepřekročily baseline.
- `qa:lock`: PASS.
- Error reporter: 56 PASS / 0 FAIL; browserová část NOT_READY kvůli spravované URLBlocklist.
- `qa:runtime`: v tomto runneru neproveditelné — `net::ERR_BLOCKED_BY_ADMINISTRATOR` z centrální Chromium URLBlocklist, nikoli potvrzená chyba aplikace.
- `qa:axe`: `not-ready-environment`, protože runner nemá lokálně dostupnou přesnou instalaci axe-core 4.12.1.

## Výkon
Funkce zvyšuje velikost hlavního buildu, proto byly blokující rozpočty explicitně posunuty, nikoli vypnuty: dist 1 025 000 B, entry HTML 425 000 B, entry critical 605 000 B, largest inline script 318 000 B, precache 905 000 B a largest file 425 000 B. Aktuální build je pod všemi limity.

## Známé hranice
Fáze 1 záměrně nepředstírá bezpečnou extrakci mapy/grafu z libovolného PDF nebo skenu. PDF může být multimodálně pochopeno a kritický vizuál detekován, ale pokud má být přesně vložen do nové verze, je zatím vyžadován samostatný obrázek nebo fotografie stránky s lokálním výřezem. Toto je vstup do Fáze 3.

## Verdikt
**GO pro Fázi 1 jako RC.** Vizuální asset pipeline je funkční a regresně chráněná. Verzi lze použít k živému pilotnímu testu map, grafů a schémat; nelze ji ještě prezentovat jako dokončenou plnou podporu všech skenů/PDF, dokud nebude hotová Fáze 3 a následná all-subject brána Fáze 4.
