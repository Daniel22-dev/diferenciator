# AUDIT REVIEW 1.3.21 — Fáze 2: STEM zápis a věcná správnost

Datum: 2026-08-14
Stav: RC — připraveno k uživatelskému testování

## Rozsah

Fáze 2 rozšiřuje Diferenciátor o bezpečnější práci se STEM obsahem v matematice, fyzice, chemii a biologii. Cílem je zachovat odborný zápis, zvýšit šanci na věcně správné příklady a výsledky a zabránit rozbití vzorců v pracovním listu a PDF.

## Hlavní změny

- nový modul `src/js/35-stem-safety.js` pro rozpoznání STEM předmětu, typografii a lokální validaci,
- bezpečné zobrazení zlomků, odmocnin, n-tých odmocnin, mocnin, indexů, vybraných matematických symbolů a chemických zápisů bez raw LaTeXu,
- rozšířený import Word Equation / OMML včetně zlomků, horních/dolních indexů, odmocnin, n-árních výrazů, jednoduchých matic a dalších běžných struktur,
- přesnější transkripce matematických a chemických znaků při importu,
- lokální deterministická kontrola běžné aritmetiky, procent, zlomků, mocnin, odmocnin, jednoduchých lineárních rovnic, široké sady převodů fyzikálních jednotek a bilance atomů i explicitních nábojů v chemických rovnicích,
- STEM pravidla jsou součástí generování, klíče řešení, kontroly kvality i zapracování oprav,
- reálný Chromium/PDF gate `qa:stem` pro matematiku, fyziku, chemii a biologii v Direct Gemini i School Gateway režimu.

## Ověření

- GHRAB Platform conformance: 109/109 PASS
- modelové profily: 17/17 PASS
- interní testy: 135/135 PASS
- regresní brána včetně T17 STEM: PASS
- `qa:stem`: PASS
- `qa:stem:school`: PASS
- fyzický matematický PDF render: PASS, bez raw LaTeXu a bez horizontálního přetečení
- fyzický chemický PDF render: PASS, indexy/náboje čitelné a bez horizontálního přetečení
- `qa:visuals` a `qa:visuals:school`: PASS
- `qa:quality`: 31/31 PASS
- `qa:browser`: PASS
- `qa:xss`: PASS
- `qa:lock`: PASS
- school-server build: PASS
- school-server model-profile browser test: PASS
- error reporter: 56 PASS / 0 FAIL; jeho URL browser část je v tomto lokálním prostředí NOT_READY kvůli spravované Chromium URLBlocklist politice.

## Co lokální validátor umí spolehlivě kontrolovat

- běžné numerické výrazy,
- zlomky, procenta, mocniny a odmocniny v podporovaném rozsahu,
- jednoduché explicitně uvedené výsledky lineárních rovnic substitucí,
- běžné převody délky, plochy, objemu, hmotnosti, času, rychlosti, tlaku, síly, energie, výkonu a frekvence,
- atomovou bilanci chemických rovnic,
- explicitní elektrické náboje v iontových rovnicích.

## Hranice / známá omezení

Lokální validátor není plnohodnotný CAS, fyzikální solver, chemický expert ani biologická databáze. Složitá symbolická matematika, více-krokové fyzikální úlohy, pokročilé organické strukturní vzorce a odborná biologická fakta stále vyžadují AI kontrolu a odpovědnost učitele. Cílem deterministické vrstvy je zachytit vysokou třídu běžných, jednoznačně ověřitelných chyb, nikoli nahradit odbornou revizi.

Plný URL-based `qa:runtime` nelze v tomto prostředí uzavřít jako PASS, protože spravovaný Chromium blokuje lokální URL (`URLBlocklist: ["*"]`). `qa:axe` zůstává podle dostupnosti přesné lokální instalace axe-core environmentálně NOT_READY. Tyto limity nejsou interpretovány jako funkční selhání aplikace.
