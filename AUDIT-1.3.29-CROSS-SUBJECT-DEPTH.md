# Audit Diferenciátoru 1.3.29 — Cross-subject depth

**Auditovaná výchozí verze:** 1.3.28 Comprehensive Engines  
**Výsledná pracovní verze:** 1.3.29  
**Datum:** 2026-08-15  
**Cíl:** ověřit, zda „all-subject“ vrstva skutečně pracuje s odbornými jevy napříč gymnaziálními předměty, a ne pouze s obecným textovým promptem; doplnit deterministické nástroje tam, kde je přínos jasný a bezpečně testovatelný.

## Verdikt

**GO WITH EXTERNAL RUNTIME/PROVIDER CONDITIONS.**

Výchozí 1.3.28 byla technicky poctivá v tom, že nepodporované odborné objekty uměla zachovat nebo odmítnout. Nejslabší místo však bylo mezi „předmět je rozpoznán“ a „odborný jev má vlastní deterministickou reprezentaci“: část STEM používala společnou nabídku odborných markerů a dějepis/informatika/biologie neměly dostatečně specifickou cestu pro několik velmi běžných typů úloh.

1.3.29 tuto mezeru zmenšuje čtyřmi novými specialistickými cestami a předmětově specifickým routingem. Všechny nové cesty jsou fail-closed: neplatný nebo nepodporovaný jev se nevykreslí jako zdánlivě správný diagram.

## Co bylo přidáno

### 1. `EDU_FLOW` — řízené vztahové a algoritmické diagramy

Nový `cross-subject-engine.js` normalizuje a validuje uzly a hrany, odkazy, duplicitní ID, limity velikosti a automatické rozložení. Renderer umí proces, rozhodnutí, start/end, entity a poznámky.

Použití: informatika, biologické procesy, taxonomie, argumentační schémata, společenské vědy, matematické postupy.

Hranice: není to vykonávač programu ani důkaz logické správnosti algoritmu.

### 2. `EDU_TIMELINE` — chronologická osa

Lokálně se validují číselné roky včetně záporných roků pro př. n. l., minimální počet událostí a chronologické řazení. Renderer nepřidává vlastní historická data.

Použití: dějepis, dějiny kultury, geologie/vědy o Zemi, společenské vědy.

Hranice: verze 1.3.29 kreslí bodové události, nikoli intervaly/nejisté datace.

### 3. `EDU_GENETICS` — Punnett + rodokmen

Punnettův engine podporuje 1–2 lokusy, počítá gamety a genotypové pravděpodobnosti a umí ověřit očekávané genotypové poměry. Nečíselná nebo mimo rozsah zadaná očekávaná pravděpodobnost je chyba. Rodokmen validuje ID, rodičovské odkazy a pořadí generací.

Použití: genetika, biologie.

Hranice: není to obecný populačně-genetický nebo molekulárně-biologický systém.

### 4. `EDU_PHYS` — vektory + spojná čočka

Vektorový engine přijímá složky nebo nezápornou velikost + úhel, počítá výslednici a umí ji porovnat s očekávanou hodnotou. Optický režim lokálně počítá zobrazovací rovnici a zvětšení.

Fail-safe hranice byla záměrně zpřísněna: renderer kreslí pouze spojnou čočku s reálným obrazem (`f > 0`, `d > f`, kladná výška předmětu). Virtuální obraz, rozptylka a další případy se v 1.3.29 odmítnou, aby nevznikl fyzikálně přesvědčivý, ale chybný nákres.

### 5. Předmětově specifický vizuální routing

Původní společný STEM koš byl rozdělen:

- matematika → chart, math, coord, flow,
- fyzika → chart, math, coord, circuit, phys, flow,
- chemie → chart, math, chem, flow,
- biologie → chart, genetics, flow,
- vědy o Zemi → chart, coord, map, timeline, flow.

Mimo STEM:

- dějepis → timeline, flow, chart,
- informatika → flow, chart,
- zeměpis → chart, map, flow,
- společenské/humanitní předměty → flow, timeline, chart,
- jazyky → flow jako strukturální/hierarchický diagram,
- hudební výchova → vlastní notový renderer.

Důležitá regresní pojistka: biologie už nedostává `EDU_CIRCUIT` jen proto, že je klasifikována jako STEM.

## Testy a důkazy

### Kompletní aplikační regrese

- `npm test` — **PASS**.
- platformní kontroly — **109 PASS**.
- all-subject static — **84 PASS**.
- specialist engines — **32/32 PASS**.
- interní testy — **142/142 PASS**.
- renderer browser QA — **PASS** včetně `flow`, `timeline`, `genetics`, `phys`.
- all-subject browser matrix — **PASS**, 111 názvů/routingů + nové předmětově specifické prompty a marker guards.
- school-server build — **PASS**.
- school-server all-subject browser/PDF — **PASS**.
- XSS sink regression — **PASS**.

### Performance budget

Zmrazený limit nebyl zvýšen.

Finální měření QA:

- `dist`: **1 049 632 B / 1 050 000 B**,
- entry HTML: **487 342 B / 490 000 B**,
- entry critical: **660 307 B / 670 000 B**,
- largest inline script: **379 233 B / 380 000 B**,
- precache: **948 096 B / 970 000 B**,
- duplicate large assets: **0 B**.

Pro srovnání výchozí audit 1.3.28 uváděl `dist` 1 049 326 B. Nové specialistické schopnosti tedy zvýšily výsledný měřený `dist` pouze o 306 B. Toho bylo dosaženo bez zvýšení budgetu: lossless rekompresí PNG (pixelově identický obsah), kompaktnějším buildem CSS a kompaktním zápisem aplikačních JSON manifestů. Hashované vendorové artefakty se nemění.

### P5 prostředí

Finální `qa:p5` znovu došel až k runtime navigaci a skončil na:

`net::ERR_BLOCKED_BY_ADMINISTRATOR`

To je stejná sandboxová environmentální hranice jako u 1.3.28. Po samostatném XSS běhu release agregace hlásí **36/37**, chybí pouze `report.runtime.exists`; acceptance je **13/15** a druhý chybějící bod je návazný status release reportu.

### Live provider

`qa:provider:live` vrací korektně:

- `status: skipped`,
- `reason: missing-credentials`.

Skutečný release musí nadále použít CI secret `DPL_LIVE_GEMINI_API_KEY` a required provider gate.

## Co 1.3.29 stále nepředstírá

1. Informatika: `EDU_FLOW` umí přesný graf algoritmu, ale neprovádí kód a neověřuje krokový trace programu.
2. Chemie: struktury a valence jsou silné, ale není zde obecný engine pro vyčíslení reakcí, stechiometrii a redoxní poločlánky.
3. Biologie: Mendelovská genetika a rodokmeny jsou deterministické; anatomie, mikroskopie a složité biochemické dráhy mají zůstat na zachovaném originálním obrázku nebo řízeném flow, ne na vymyšlené ilustraci.
4. Fyzika: vektory, obvody a omezená geometrická optika nejsou obecný mechanický/elektromagnetický simulátor.
5. Dějepis: časová osa zatím nemá intervaly, rozsahy ani explicitní nejistotu datace.
6. Jazyky: strukturální strom lze reprezentovat pomocí `EDU_FLOW`, ale aplikace nemá vlastní morfologický/syntaktický parser ani výslovnostní analyzátor.
7. Aktuální právo, politika, statistiky a jiné časově citlivé údaje nejsou offline deterministicky ověřovány; správná cesta je zdroj + datum nebo explicitní teacher review.
8. Profesionální Office/MusicXML/GIS/CAD/3D objekty zůstávají za explicitní fail-safe hranicí.

## Doporučený další vývoj

### P1 — `EDU_TRACE`: omezený algoritmický tracer

Ne spouštění libovolného kódu. Doporučuji malý deterministický AST/interpreter pro školní pseudokód: proměnné, přiřazení, podmínky, `for`/`while`, jednoduchá pole a krokovou tabulku. Přínos: informatika, algoritmizace a část matematiky. Bezpečnost i reprodukovatelnost jsou výrazně lepší než sandboxování libovolného JS/Pythonu.

### P1 — `EDU_REACTION`: chemická rovnice + stechiometrie

Parser sumárních vzorců, bilance atomů/náboje, vyčíslení běžných reakcí lineární algebrou a ověření jednoduchých molárních poměrů. To by uzavřelo největší zbývající deterministickou mezeru v chemii.

### P1/P2 — `EDU_ANNOTATE`: anotace zachovaného originálu

Vrstva šipek, čísel a popisek nad **existujícím zachovaným** obrázkem s normalizovanými souřadnicemi. Ne generování anatomie/mapy. Využití: biologie, zeměpis, dějepisné prameny, výtvarná výchova, fyzika a laboratorní schémata. Nutná je vazba na ID zdrojového assetu a fail-closed chování při chybějícím assetu.

### P2

- časové intervaly a nejistá datace v `EDU_TIMELINE`,
- free-body diagram nad vektorovým enginem,
- další bezpečně definované případy geometrické optiky,
- statistiký validator pro tabulky/datasetové úlohy,
- případně fonetický/IPA renderer; ne vlastní jazykový „opravovač“ bez jasné odborné specifikace.

## Release doporučení

1. Kód 1.3.29 je pro definovaný gymnaziální rozsah **GO**.
2. Produkční označení úplného release ponechat pod dvěma externími podmínkami: normální P5 runtime prostředí a živý provider audio/video PASS v GitHub Actions.
3. Pro další etapu nezačínat dalším obecným „podporujeme předmět“. Měřítkem má být konkrétní jev + deterministická reprezentace/validace + explicitní fail-safe hranice + browser/PDF regresní test.
