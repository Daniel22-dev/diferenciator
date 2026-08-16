# GARP review a opravy Diferenciátoru 1.3.31

**Datum:** 2026-08-15  
**Výchozí kandidát:** 1.3.30 `DEEP-SUBJECT-ENGINES`  
**Primární auditor:** Claude, `AUDIT-DIFERENCIATOR-1.3.30-2026-08-15.txt`  
**Sekundární reviewer / implementace:** ChatGPT  
**Výsledná verze:** 1.3.31 `GARP-AUDIT-FIXES`

## Verdikt

**GO WITH EXTERNAL RUNTIME/PROVIDER CONDITIONS.**

Všech devět P0/P1 nálezů z nezávislého auditu bylo proti zdroji 1.3.30 reprodukováno jako reálných. V 1.3.31 jsou uzavřené opravou, fail-closed chováním nebo tvrdou release pojistkou. U P0-1 byla přijata diagnóza nedostatečné výkonové rezervy, nikoli návrh uvolnit raw budgety: zmrazené limity zůstaly beze změny a kritický bundle byl architektonicky zmenšen lazy oddělením interní testovací konzole.

Lokální `npm test` je PASS. Kompletní P5 v auditním sandboxu projde všechny kroky před `qa:runtime`; lokální HTTP navigaci Chromia následně blokuje prostředí pomocí `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Live provider smoke je bez credentialu korektně `SKIPPED`. Produkční GO proto stále vyžaduje normální GitHub runtime gate a required live-provider gate.

## Adjudikace Claudeových nálezů

| Nález | Verdikt review | Stav 1.3.31 | Implementace / důkaz |
|---|---|---|---|
| P0-1 — výkonová rezerva 1 B | **CONFIRMED**, navržené uvolnění raw budgetu odmítnuto | **CLOSED** | `50-interni-testy.js` je lazy `internal-tests.js`, nikoli součást critical inline bundle. Raw budgety nebyly zvýšeny. Largest inline: 333 436 / 380 000 B. Test +500 B v promptové vrstvě: quality 31/31 PASS. |
| P0-2 — `//` fail-open v traceru | **CONFIRMED** | **CLOSED** | Tokenizer rozlišuje `//` jako operátor; celočíselné dělení používá floor semantiku. Celé řádky `//`, `#`, `REM` zůstávají komentáře. `http://...` v řetězci se nezkrátí. |
| P0-3 — neplatné prvky v reakci | **CONFIRMED** | **CLOSED** | Zmrazený whitelist všech 118 symbolů H–Og; `NAOH` je odmítnuto jako neznámý symbol `A`. |
| P0-4 — arbitrární řešení nejednoznačné reakce | **CONFIRMED** | **CLOSED** | Nullspace s dimenzí > 1 bez doplňující podmínky končí chybou. `expectedCoefficients` mohou sloužit jako explicitní pedagogická podmínka a jsou ověřeny proti atomové/nábojové bilanci. |
| P1-5 — tisk nečeká hydrataci | **CONFIRMED** | **CLOSED** | `#printConfirm` je async, obnoví print HTML a `await`uje `hydrateEducationalVisuals(#printArea)` před `window.print()`. |
| P1-6 — vadný vizuál se vytiskne | **CONFIRMED** | **CLOSED** | Po hydrataci se sbírají `data-edu-ready="error"`; tisk se blokuje, zobrazí se seznam důvodů a pokračovat lze pouze přes druhý explicitní checkbox výjimky. Interní browser QA ověřuje blokaci i override. |
| P1-7 — deformace anotací | **CONFIRMED** | **CLOSED** | Renderer čeká na `naturalWidth/naturalHeight`, viewBox odpovídá reálnému aspect ratio. Browser důkaz 16:9: `0 0 1000 562.5`, poměr šířka/výška bodové značky 1.000014. |
| P1-8 — `map-presets.js` mimo precache | **CONFIRMED** | **CLOSED** | `map-presets.js` je povinný `CORE_ASSET`. Build nově selže, pokud SW neeviduje kterýkoli specialistický modul, a zvlášť vyžaduje map preset v core. |
| P1-9 — praktický strop trace | **CONFIRMED** | **CLOSED** | Engine dovoluje `maxSteps` do 2000; renderer standardně 250 řádků a rozsah 40–300. Delší stopa se nezahodí: zobrazí začátek + konec a explicitní mezeru. Bubble sort n=10: 236 kroků, správně seřazené pole. |

## Další Claudeovy P2 body

### P2-10 — ručně kompaktní zdrojové moduly

**CONFIRMED, PARTIALLY MITIGATED / BACKLOG.** Tlak performance budgetu je odstraněn code-splitem testovací konzole, takže další zdroj už není nutné ručně zkracovat kvůli critical bundle. Existující kompaktní specialistické moduly ale nebyly mechanicky „beautify“ přepsány v tomto fix release, protože taková plošná transformace by zbytečně zvětšila regresní plochu. Doporučení pro další údržbovou verzi: automatický formatter/minifier v build pipeline a čitelné `src/modules/*`.

### P2-11 — sémantické drobnosti traceru

**CONFIRMED, převážně CLOSED.**

- `-1 % 3` nyní vrací `2`.
- Číselný výstup používá stabilní 12-significant-digit formát (`0.1 + 0.2` → `0.3`).
- Porovnání polí je hodnotové (`[1,2] == [1,2]` → `true`).
- `ELSE IF` a jednořádkový `IF ... THEN ...` zůstávají mimo jazyk; prompt je nyní výslovně zakazuje místo předstírání podpory.

### P2-12 — sestavené artefakty v repozitáři

**CONFIRMED, BACKLOG / DEPLOYMENT DECISION.** V této opravné verzi nebyla měněna distribuční struktura repozitáře, protože současný release/deploy workflow s `dist` pracuje. Samostatný cleanup má být proveden až jako řízená změna repozitářové politiky, ne společně s odbornými opravami.

### P2-13 — XSS gate je regresní inventura

**CONFIRMED, KNOWN LIMITATION.** `qa:xss` zůstává zelená regresní inventura, nikoli formální důkaz bezpečnosti každého sinku. Nový visual-gate vytváří seznam chyb DOM API (`textContent`/`replaceChildren`), nikoli syrovým HTML. Přechod od současné inline architektury k hash-based CSP patří do samostatné bezpečnostní/refaktorovací etapy.

## Opravy traceru (`EDU_TRACE`)

- `//` je binární celočíselné dělení, nikoli slepě odřezávaný suffix.
- Řetězec obsahující `//` se zachová celý.
- Komentáře `//`, `#`, `REM` jsou povolené jako samostatné řádky.
- Python-like modulo záporných čísel.
- Hodnotové porovnání polí.
- Stabilní formát čísel v PRINT/trace.
- Step budget: default 600, hard max 2000.
- Render budget: default 250, konfigurovatelný 40–300; dlouhá stopa se zkrátí s viditelnou poznámkou.
- Prompt výslovně popisuje podporovanou syntaxi a nepodporované `ELSE IF` / one-line IF.

## Opravy chemických reakcí (`EDU_REACTION`)

- Validita symbolu prvku je oddělena od dostupnosti molární hmotnosti.
- Parser přijímá pouze 118 platných symbolů H–Og.
- Nejednoznačná bilanční soustava bez další podmínky je fail-closed.
- `expectedCoefficients` se u nejednoznačné rovnice ověřují jako kladná celá čísla proti celé atomové/nábojové matici a normalizují se společným dělitelem.
- Standardní iontové/redoxní regresní případy zůstávají PASS.

## Opravy tisku a anotací

- Tisková cesta čeká na hydrataci před `window.print()`.
- Import/render failure není tiše spolknutý; stane se položkou učitelského visual-gate.
- Vadný odborný vizuál bez explicitního override nelze vytisknout.
- Anotace používá skutečné rozměry zdrojového obrazu a fyzicky nedeformuje kruhy, text ani šipky na 16:9/A4/4:3 podkladech.

## Offline mapa

`modules/map-presets.js` je od 1.3.31 povinný `CORE_ASSET`. `scripts/sw-assets.mjs`:

1. ověřuje existenci core assetů,
2. porovná všechny `dist/modules/*.js` se SW evidencí,
3. explicitně vyžaduje `map-presets.js` v `CORE_ASSETS`.

Aktuální build: **27 core assetů + 11 specialistických modulů evidováno**.

## QA a regrese

Finální pracovní kopie:

- `npm test` — **PASS**.
- GHRAB platform — **109/109 PASS**.
- AI profiles — **22/22 PASS**.
- all-subject static — **92/92 PASS**.
- multimedia — **19/19 PASS**.
- specialist adversarial engines — **56/56 PASS**.
- renderer browser v5 — **PASS**.
- interní browser/smoke — **144/144 PASS**.
- `qa:quality` — **31/31 PASS**.
- school-server build — **PASS**.
- `qa:lock` — **PASS**.
- `qa:xss` — **PASS**.
- live provider bez credentialu — **SKIPPED / missing-credentials**.

### Claude acceptance — explicitní regresní případy

1. +500 náhodných/promptových bajtů: `qa:p3-quality` **31/31 PASS**, largest inline 333 937 B při testu.
2. `7 // 2` → `3` bez chyby.
3. `NAOH + HCl -> NACl + H2O` → neprázdné `errors`.
4. `C + O2 -> CO + CO2` bez podmínky → neprázdné `errors`.
5. Renderer browser hydruje `EDU_TRACE`, `EDU_REACTION` i `EDU_ANNOTATE`; tisková cesta má explicitní await a interní visual-gate test.
6. Vadný vizuál: první tisk blokován; druhé explicitní potvrzení je povinné pro override.
7. 16:9 anotace: bodová značka zůstává kruh (ratio ~1.000014).
8. `map-presets.js` je povinný core precache asset a build kontroluje úplnost modulů.
9. Bubble sort 10 prvků: 236 trace kroků, výsledek `[1,2,3,4,5,6,7,8,9,10]`; renderer dlouhou tabulku korektně zkrátí.

## Performance budget — limity NEZVÝŠENY

Finální 1.3.31:

- dist: **1 035 096 / 1 050 000 B**
- entry HTML: **444 088 / 490 000 B**
- entry critical: **594 537 / 670 000 B**
- largest inline script: **333 436 / 380 000 B**
- precache: **914 295 / 970 000 B**
- largest file: **444 088 / 490 000 B**
- duplicate large assets: **0 / 30 000 B**

Oproti 1.3.30 tedy critical inline získal přibližně 46,5 kB rezervy bez uvolnění limitu. Vnitřní testovací konzole je dostupná lazy jako `internal-tests.js`, ale není součástí produkčního critical inline payloadu.

## P5 / externí podmínky

`npm run qa:p5` na finálním 1.3.31 prošel všechny předchozí kroky včetně specialistů a rendererů a zastavil se až v `qa:runtime` při lokální HTTP navigaci Chromia:

`net::ERR_BLOCKED_BY_ADMINISTRATOR`

To odpovídá omezení auditního sandboxu, nikoli aplikačnímu assertion failure. Samostatná XSS brána je PASS.

`qa:provider:live` bez `DPL_LIVE_GEMINI_API_KEY` / `GEMINI_API_KEY` vrací `status: skipped, reason: missing-credentials`. Release/deploy musí nadále používat required provider gate.

## Release rozhodnutí

1. **1.3.30 zůstává NE-GO pro plošné nasazení podle Claudeova auditu.**
2. **1.3.31 uzavírá všechny jeho P0/P1 nálezy a je lokálně GO WITH EXTERNAL RUNTIME/PROVIDER CONDITIONS.**
3. Před produkčním označením GO spustit nezměněný 1.3.31 release candidate v GitHub Actions s normálním runtime Chromium a required live provider secretem.
4. Po externím GO tento release candidate znovu neotevírat obecným „najdi ještě něco“ auditem; P2-10/12/13 a další rozvoj patří do backlogu další verze.
5. Další funkční etapa má začít adversariálním + corpus-driven acceptance benchmarkem reálných gymnaziálních materiálů, nikoli přidáváním dalšího markeru bez evidence.
