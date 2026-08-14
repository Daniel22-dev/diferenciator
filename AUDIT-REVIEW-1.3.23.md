# AUDIT REVIEW 1.3.23 — Fáze 4: all-subject release gate

Datum: 2026-08-14
Stav: RC — před finálním živým pilotem

## Rozsah

Fáze 4 uzavírá univerzální pokrytí aplikace po Fázi 1 (obrazové podklady), Fázi 2 (STEM) a Fázi 3 (fotografie/skeny/PDF). Nová brána ověřuje, že předmětová specifika nejsou pouze dokumentace, ale jsou zapojena do generování, tvorby klíče, kontroly kvality, lokální validace, renderu a PDF.

## Nálezy a opravy

1. Při prvním průchodu all-subject testu se ukázala kolize krátké zkratky `IT` se slovem `Literatura`; klasifikátor byl opraven tak, že krátké zkratky se párují pouze jako samostatné tokeny. Test nyní rozlišuje Literaturu jako humanitní předmět a Informatiku/ICT jako informatiku.
2. Běžné pipe/tab tabulky byly dříve jen text s `white-space: pre-wrap`. Fáze 4 je bezpečně renderuje jako skutečné tabulky se zalamováním a tiskovým stylem.
3. Lokální výstupní validace nově upozorní na nevyřešené nečitelné části a na zjevně chybějící očíslované položky v klíči.
4. Předmětové prompty chrání oblasti, které univerzální STEM pravidla nepokrývala: mapy a aktuální geografická data, historické prameny/citace, časově citlivé ZSV údaje, kód a verze, jazykové alternativní odpovědi, hudební notaci, reprodukce ve výtvarné výchově a bezpečnost TV.

## Release kritérium

Verze 1.3.23 může být označena za aplikačně univerzální teprve po zeleném `qa:all-subjects` a `qa:all-subjects:browser` v Direct režimu, stejném browser testu v School Gateway a zachování všech starších bran Fází 1–3.

## Výkonový rozpočet

Kvůli nové trvalé předmětové vrstvě a tabulkovému rendereru byly stále blokující statické limity omezeně posunuty na dist 1 050 kB, entry HTML/largest file 490 kB, critical 670 kB, largest inline script 380 kB a precache 970 kB. Brána zůstává povinná; nejde o její vypnutí.

## Výsledky release bran

- GHRAB Platform conformance: **109/109 PASS**
- modelové profily: **17/17 PASS**
- interní testy: **139/139 PASS**
- regresní brána včetně T19: **PASS**
- `qa:all-subjects`: **35/35 PASS**
- `qa:all-subjects:browser`: **PASS** (Direct Gemini)
- `qa:all-subjects:school`: **PASS** (School Gateway)
- `qa:visuals` / `qa:visuals:school`: **PASS**
- `qa:scan` / `qa:scan:school`: **PASS**
- `qa:stem` / `qa:stem:school`: **PASS**
- `qa:quality`: **31/31 PASS**
- `qa:browser`: **PASS**
- `qa:xss`: **PASS**
- `qa:lock`: **PASS**
- school-server build a model-profile browser test: **PASS**
- error reporter: **56 PASS / 0 FAIL**; browserová část je `NOT_READY` kvůli spravované Chromium URLBlocklist politice.
- `qa:runtime`: lokálně **NOT_READY / blokováno prostředím** (`net::ERR_BLOCKED_BY_ADMINISTRATOR`).
- `qa:axe`: **not-ready-environment**; lokální runner nemá k dispozici požadovanou přesnou instalaci axe-core 4.12.1.

## Verdikt

**GO WITH ENVIRONMENT-LIMITED RUNTIME CHECKS** pro RC/pilot. Fáze 4 uzavírá aplikační all-subject coverage; po nahrání na GitHub zůstává povinný živý pilot na reálných materiálech a GitHub CI/runtime kontrola. Věcnou pravdivost otevřených odborných úloh nelze garantovat pouze klientskou statickou bránou, proto zůstává finální učitelská kontrola součástí workflow.
