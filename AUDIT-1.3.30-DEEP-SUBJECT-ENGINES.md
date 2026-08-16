# Audit Diferenciátoru 1.3.30 — Deep Subject Engines

**Auditovaná výchozí verze:** 1.3.29 Cross-subject depth  
**Výsledná pracovní verze:** 1.3.30  
**Datum:** 2026-08-15  
**Cíl:** realizovat všech pět doporučených hloubkových rozšíření z auditu 1.3.29 a ověřit jejich skutečné zapojení do generování, validace, browserového renderingu, tisku/PDF, offline vrstvy a release gate.

## Verdikt

**GO WITH EXTERNAL RUNTIME/PROVIDER CONDITIONS.**

Všech pět doporučení z 1.3.29 je implementováno. Informatika získala skutečný omezený tracer pseudokódu, chemie deterministickou bilanci rovnic a jednoduchou stechiometrii, obrazově založené předměty bezpečnou anotaci zachovaného originálu, časová osa intervaly a nejistou dataci a fyzika validovaný free-body diagram.

Nové cesty jsou navrženy fail-closed: pokud engine nemůže odborný jev spolehlivě zpracovat, nevytváří přesvědčivou aproximaci. Zachování originálu zůstává preferovanou cestou tam, kde je věrnost zdroje důležitější než rekonstrukce.

## Pět návrhů uzavřeno

### 1. `EDU_TRACE` — omezený algoritmický tracer

Nový `algorithm-trace-engine.js` interpretuje školní pseudokód v deterministickém, omezeném jazyce. Podporuje:

- přiřazení (`=`, `<-`, `:=`, `LET`, `SET`),
- skalární proměnné a jednoduchá pole,
- `IF / ELSE / END IF`,
- `FOR / TO / STEP / NEXT`,
- `WHILE / END WHILE` / `WEND`,
- `PRINT`,
- indexování od 0 nebo 1,
- whitelist funkcí `LEN`, `ABS`, `ROUND`, `MIN`, `MAX`,
- sledované proměnné, krokovou trace tabulku, očekávané proměnné a očekávaný výstup.

Běh má tvrdé limity počtu řádků, kroků a velikosti polí. Engine nepoužívá `eval`, `new Function` ani síť. Nejde o sandbox libovolného JavaScriptu/Pythonu; mimo definovaný školní pseudojazyk se vstup odmítne.

**Přínos:** informatika už nemusí pouze kreslit flowchart. Umí deterministicky ověřit průběh jednoduchého algoritmu a z něj vytvořit pracovní trace tabulku.

### 2. `EDU_REACTION` — chemické rovnice a jednoduchá stechiometrie

Nový `reaction-engine.js` obsahuje:

- parser sumárních vzorců,
- vnořené závorky a běžné hydráty,
- explicitní iontové náboje, např. `Fe^3+`, `SO4^2-`, `e^-`,
- atomovou i nábojovou bilanci,
- přesné racionální vyčíslování rovnic,
- kontrolu už zadaných nebo očekávaných koeficientů,
- jednoduchý přepočet mezi jedním známým a jedním hledaným druhem v jednotkách mol, mmol, g a částice/molekuly.

Bilance používá přesnou racionální lineární algebru, nikoli numerické hádání. U iontových rovnic se zachovává i náboj.

**Fail-safe hranice:** engine vyčísluje pouze explicitně uvedené reagující látky. Neodvozuje chybějící `H2O`, `H+`, `OH-`, redoxní prostředí, mechanismus ani produkty reakce. Pokud je zadání chemicky nedostatečné nebo parser nemá potřebnou molární hmotnost, má skončit kontrolou/odmítnutím, ne vymyšlením reakce.

### 3. `EDU_ANNOTATE` — anotace zachovaného originálního obrazu

`EDU_ANNOTATE` přidává sémantickou vrstvu nad existující `VISUAL_n`:

- bod,
- šipka,
- rámeček,
- text/popisek,
- legenda,
- normalizované souřadnice 0–1.

Zdrojový obraz se nepřekresluje. Renderer používá původní data URL daného `VISUAL_n` a nad obrazem vykreslí pouze SVG anotace. Pokud zdrojový asset neexistuje, marker se považuje za chybný.

Integrační test ověřuje současně:

- přesnou vazbu na původní base64 obraz,
- stejnou vazbu v tiskové/PDF cestě,
- že `VISUAL_n` není vedle anotované verze vložen podruhé.

**Přínos:** anatomie, mikroskopie, mapy, historické prameny, výtvarné objekty, laboratorní fotografie nebo fyzikální snímky mohou zůstat pixelově věrné a přitom se stát aktivní součástí pracovního listu.

**Hranice:** engine ověří zdroj, geometrii a datový model anotace. Nemůže sám dokázat, že popisek „mitochondrie“ nebo „Praha“ míří na odborně správné místo; sémantická správnost popisku stále patří do kontroly zdroje/AI výstupu a učitelské revize.

### 4. `EDU_TIMELINE` — období a nejistá datace

Časová osa nově rozlišuje:

- bodovou událost (`year`),
- období (`startYear` + `endYear`),
- nejistotu kolem data (`uncertainty`),
- přibližnou dataci (`approximate` / `circa`).

Události se lokálně chronologicky normalizují; obrácený interval je chyba. Renderer vizuálně odlišuje období a nejisté rozpětí.

**Přínos:** dějepis, geologie a dějiny kultury už nemusí redukovat dlouhé procesy na falešně přesný bod.

**Hranice:** `uncertainty` je způsob reprezentace zadané nejistoty, nikoli nástroj pro historické ověření zdrojů či datace.

### 5. `EDU_PHYS` — free-body diagram a kontrola Newtonovy rovnice

Fyzikální engine dostal režim `fbd`:

- těleso,
- síly jako přesné vektory,
- lokální výpočet výslednice,
- volitelné osy a výslednici,
- hmotnost a zrychlení,
- kontrolu konzistence `ΣF = m·a`.

Nulová síla, neplatný vektor nebo nesoulad zadané hmotnosti/zrychlení s výslednicí vede k chybě místo zdánlivě korektního obrázku.

**Hranice:** jde o deterministický free-body diagram a vektorovou kontrolu, nikoli obecný mechanický simulátor.

## Routing, validace a integrace

Nové markery nejsou izolované knihovny. Jsou zapojeny do `36-all-subject-safety.js`, validační vrstvy, promptových instrukcí, browserového hydratoru, print/PDF renderingu i offline cache.

Hlavní routing:

- informatika → `EDU_TRACE` + `EDU_FLOW`,
- chemie → `EDU_REACTION` + `EDU_CHEM`,
- biologie → `EDU_GENETICS` + `EDU_ANNOTATE`,
- dějepis → `EDU_TIMELINE` + `EDU_ANNOTATE`,
- fyzika → `EDU_PHYS` včetně `fbd` + obvody/souřadnice,
- zeměpis, vědy o Zemi, výtvarné a další obrazové domény → `EDU_ANNOTATE` tam, kde je vhodnější zachovat původní objekt.

All-subject browser QA ověřuje, že nové cesty jsou skutečně nabízeny relevantním předmětům a že neplatné markery projdou stejnou validační branou jako starší specialistické formáty.

## QA a regrese

### Hlavní aplikační gate

- `npm test` — **PASS**.
- platformní konformance — **109/109 PASS**.
- interní testy — **142/142 PASS**.
- all-subject static — **92/92 PASS** (1.3.29 měla 84/84).
- specialist engines — **46/46 PASS**.
- all-subject browser matrix — **PASS**, 111 názvů/routingů.
- renderer browser QA — **PASS** včetně trace, reaction, annotation, interval timeline a FBD.
- Office-rich / multimedia / scan / STEM regresní cesty — **PASS** v rámci `npm test`.

### `EDU_ANNOTATE` end-to-end

Browserová visual-assets QA ověřila:

- `noDuplicate: true`,
- `sourceBound: true`,
- `printBound: true`,
- zdroj `VISUAL_1`.

Stejná kontrola prošla i ve school-server buildu.

### School-server profil

- `build:school-server` — **PASS**.
- school all-subject browser/PDF — **PASS**.
- school visual-assets včetně anotovaného originálu — **PASS**.
- generovaný all-subject PDF prošel browserovou testovací cestou.

### XSS / dynamické spouštění kódu

Samostatná bezpečnostní inventura — **PASS**:

- `eval`: **0**,
- `new Function`: **0**,
- `outerHTML`: **0**,
- `document.write`: **0**.

Počet `innerHTML` sinků je nižší než v uložené baseline (57 vs. 62). Toto je regresní inventura sinků; sama o sobě není důkazem bezpečnosti každého HTML sinku. Existující CSP architektura stále obsahuje `unsafe-inline` a nebyla v této změně přepracována.

## Zmrazený performance budget

Limity nebyly zvýšeny. Finální `qa:quality` je **31/31 PASS**.

| Metrika | 1.3.30 | Limit |
|---|---:|---:|
| `dist` | **1 024 354 B** | 1 050 000 B |
| entry HTML | **489 961 B** | 490 000 B |
| entry critical | **640 410 B** | 670 000 B |
| largest inline script | **379 999 B** | 380 000 B |
| precache | **932 664 B** | 970 000 B |
| largest file | **489 961 B** | 490 000 B |
| duplicate large assets | **0 B** | 30 000 B |

Důležitá poznámka: `largest inline script` je pouze **1 B pod zmrazeným stropem**. Gate je zelený, ale tento konkrétní budget už nemá praktickou rezervu. Další růst inline promptové/runtime vrstvy by měl předcházet skutečný split/refaktor, ne zvýšení limitu.

Aby zůstaly limity beze změny, byly odstraněny nepoužívané varianty PWA ikon 48/72/96/128/180 px; manifest nadále používá existující 192/512/maskable varianty a Apple touch ikona používá 192 px soubor. Specialistické enginy ani jejich testy se kvůli budgetu neomezovaly.

## P5 prostředí

Agregovaný `qa:p5` prošel všechny předcházející kroky až k runtime navigaci. Sandboxové Chromium následně odmítlo lokální HTTP navigaci:

`net::ERR_BLOCKED_BY_ADMINISTRATOR`

To je stejný environmentální limit jako v předchozích auditech. Nelze proto označit celý P5 za PASS. Samostatný XSS gate byl po tomto běhu spuštěn a prošel.

## Live audio/video provider

`qa:provider:live` skončil korektně:

- `status: skipped`,
- `reason: missing-credentials`,
- `required: false`.

Auditní prostředí nemá skutečný provider secret. Produkční release musí nadále spustit required gate s `DPL_LIVE_GEMINI_API_KEY`; bez reálného live audio/video PASS se externí podmínka nepovažuje za uzavřenou.

## Zbytkové odborné hranice

1. `EDU_TRACE` není obecný programovací runtime: nepodporuje libovolný JS/Python, funkce, rekurzi nebo neomezené vykonávání.
2. `EDU_REACTION` neodvozuje chybějící redoxní činidla, prostředí, produkty ani reakční mechanismus; pracuje s explicitně zadanými druhy.
3. `EDU_ANNOTATE` zachovává zdrojové pixely a ověřuje datový model, ale sémantická správnost umístění popisku vyžaduje obsahovou kontrolu.
4. FBD je přesná školní vektorová reprezentace, ne simulátor dynamiky, tření, kontaktů a tělesných vazeb obecně.
5. Časová nejistota reprezentuje zadaný interval; neověřuje historickou pravdivost.
6. Profesionální CAD/GIS/MusicXML/Office 3D/embedded OLE a další proprietární objekty zůstávají za zachovávací/fail-safe hranicí.

## Doporučená další etapa

Po 1.3.30 už nedoporučuji přidávat další marker pouze proto, aby se zvětšil seznam schopností. Největší technický přínos bude mít **corpus-driven acceptance benchmark** nad skutečnými obtížnými gymnaziálními materiály.

Doporučený rámec:

- 10–20 obtížných reprezentativních pracovních listů/testů pro hlavní domény,
- očekávané invariants: co se musí zachovat, co se smí transformovat a co musí failnout,
- samostatné goldens pro zadání, řešení, odborné markery, obrazy a tisk/PDF,
- skóre za sémantickou věrnost, ne pouze „výstup se vyrenderoval“,
- automatické zařazení každé nalezené produkční chyby do regresního korpusu.

Pro materiály se skutečnými údaji žáků je nutná anonymizace před vložením do benchmarku.

Teprve failure clustering z tohoto korpusu by měl rozhodnout, zda další priorita bude např. statistický/datasetový validator, hlubší redoxní chemie, další optika, syntaktická/IPA reprezentace nebo jiný specialistický nástroj.

## Release doporučení

1. 1.3.30 je **GO pro definovaný lokálně a browserově otestovaný gymnaziální rozsah**.
2. Úplný produkční release zůstává pod dvěma externími podmínkami: normální P5 runtime v prostředí bez sandboxového blokování a required live provider PASS.
3. V GitHub Actions ponechat živý provider gate s `DPL_LIVE_GEMINI_API_KEY` jako blokující podmínku.
4. Další odbornou hloubku řídit reálným regresním korpusem, ne rozšiřováním marketingového seznamu podporovaných předmětů.
