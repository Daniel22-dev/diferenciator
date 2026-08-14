# AUDIT REVIEW 1.3.22 — Fáze 3: fotografie, skeny a naskenovaná PDF

Datum: 2026-08-14
Stav: RC — před finálním uživatelským testováním

## Rozsah

Fáze 3 řeší robustnost vstupu z fotografie, skenu a PDF bez textové vrstvy a návaznost na obrazové assety z Fáze 1. Cílem není zavést klasické OCR, ale bezpečně využít multimodální čtení modelu a ponechat učiteli kontrolu nad obrazem, který se skutečně dostane do nového listu.

## Implementované pojistky

- zdrojové obrazové assety mají oddělený originál pro výstup a volitelnou `analysis_data` kopii pro AI čtení,
- lokální otočení, pořadí, výřez a kontrastní čtecí kopie nevyžadují další AI request,
- heuristický quality preflight upozorňuje na nízké rozlišení, nízký kontrast a možné rozmazání,
- `SCAN_REPORT` a zákaz domýšlení nečitelných údajů jsou součástí importní instrukce,
- multimodální PDF je instruováno k průchodu každé stránky i bez textové vrstvy,
- podporován je jeden PDF dokument spolu s přesnými doplňkovými obrázky/výřezy,
- explicitní učitelské rozhodnutí o režimu vizuálu se po AI manifestu nepřepisuje,
- projektový restore označuje obnovenou učitelskou volbu jako explicitní, aby ji následná logika nezměnila.

## Automatické ověření

Nový `qa:scan` v reálném Chromiu ověřuje:

1. kombinovaný vstup PDF + fotografie,
2. lokální warning nízkého kontrastu,
3. vytvoření AI-only kontrastní kopie při zachování originálu,
4. skutečné použití této kopie v Core media requestu,
5. lokální otočení zdroje,
6. parsování a zobrazení `SCAN_REPORT`,
7. `PDF_VISUAL` poznámku k obrazově klíčovému prvku na konkrétní stránce,
8. přidání přesného doplňkového výřezu k PDF,
9. změnu pořadí obrazů,
10. současné odeslání PDF i image částí,
11. použití původních obrazových dat ve výsledném `<figure>`, nikoli AI-only čtecí kopie.

Test je dostupný v Direct Gemini i School Gateway variantě.

## Release omezení

Lokální browser URL gate může v tomto spravovaném prostředí zůstat NOT_READY kvůli administrátorské Chromium URLBlocklist politice. Axe runtime gate závisí na dostupnosti přesné lokální verze axe-core. Tyto environmentální limity se nesmí vydávat za funkční PASS ani za selhání aplikace.

## Výsledky release bran před zabalením

- GHRAB Platform conformance: **109/109 PASS**
- modelové profily: **17/17 PASS**
- interní testy: **139/139 PASS**
- regresní brána včetně T18: **PASS**
- `qa:scan`: **PASS**
- `qa:scan:school`: **PASS**
- `qa:visuals`: **PASS**
- `qa:visuals:school`: **PASS**
- `qa:stem`: **PASS**
- `qa:stem:school`: **PASS**
- `qa:quality`: **31/31 PASS**
- `qa:browser`: **PASS**
- `qa:xss`: **PASS**
- `qa:lock`: **PASS**
- school-server build: **PASS**
- school-server model-profile browser test: **PASS**
- error reporter: **56 PASS / 0 FAIL**; browser část je lokálně `NOT_READY` kvůli spravované Chromium URLBlocklist politice.
- `qa:runtime`: lokálně **NOT_READY / blokováno prostředím** (`net::ERR_BLOCKED_BY_ADMINISTRATOR`).
- `qa:axe`: **not-ready-environment** bez přesné lokální instalace `axe-core 4.12.1`.

Výkonová brána zůstala beze změny a prošla v původních limitech 1.3.21; nebylo nutné navyšovat budgety.
