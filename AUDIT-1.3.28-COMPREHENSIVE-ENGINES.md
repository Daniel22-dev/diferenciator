# Audit Diferenciátoru 1.3.28 — Comprehensive Engines

**Auditovaná verze:** 1.3.28  
**Datum:** 2026-08-15  
**Výchozí release:** 1.3.27  
**Auditní otázka:** Lze uzavřít sedm známých hranic tak, aby Diferenciátor prakticky pokryl gymnaziální testy a pracovní listy napříč odbornými zápisy, aniž by odborný obsah tiše zjednodušoval nebo falšoval?

## Verdikt

**GO WITH EXTERNAL RELEASE CONDITION.** Sedm oblastí je implementačně pokryto. Deterministické a browserové testy lokálně procházejí; živá providerová audio/video brána je implementována a zapojena do release CI, ale v auditním sandboxu nebyl dostupný skutečný API secret, takže její externí výsledek je korektně `SKIPPED`, nikoli PASS.

Pro absolutní tvrzení „všechno“ používá 1.3.28 přesnější definici: **všechny typické gymnaziální úlohy mají vlastní podporovanou cestu nebo explicitní fail-safe cestu zachování originálu.** Aplikace nesmí předstírat, že umí pixelově rekonstruovat libovolný proprietární Office objekt, profesionální orchestrální engraving, libovolné TeX makro nebo kompletní cheminformatiku.

## Matice sedmi bodů

| # | Oblast | Stav | Co je pokryto | Fail-safe hranice |
|---|---|---|---|---|
| 1 | Hudební notace | IMPLEMENTED + PASS | více osnov/hlasů, klíče, noty/akordy/pomlky, posuvky, takt, dynamika, lyrics, artikulace, ligatury, tempo | profesionální engraving/MusicXML se zachová jako originál |
| 2 | Chemie | IMPLEMENTED + PASS | SMILES subset, graf, valence, izotopy, H, formální náboje, Lewisovy páry, radikály | exotické prvky/vazebné stavy a 3D stereochemie vyžadují kontrolu/originál |
| 3 | Elektrická schémata | IMPLEMENTED + PASS | běžné školní 2vývodové značky + NPN/PNP, op-amp, transformátor, SPDT | specializované průmyslové CAD symboly se nepřibližují |
| 4 | Mapy | IMPLEMENTED + PASS | preset mapy + libovolný Polygon/MultiPolygon GeoJSON, highlight, lokální simplifikace | nepodporovaná geometrie/obří data se odmítnou |
| 5 | Matematika | IMPLEMENTED + PASS | TeX→MathML + ekvivalence, derivace, evaluate, 1D rovnice, lineární soustavy do 8 neznámých | neznámý TeX/CAS problém se explicitně označí |
| 6 | Office | IMPLEMENTED + PASS | images, chart cache, SmartArt text, běžné DrawingML tvary/spojnice v DOCX/PPTX/XLSX | `OFFICE_VISUAL_REVIEW` + PDF/snímek pro nereprodukovatelný native objekt |
| 7 | Live audio/video provider | IMPLEMENTED + CI-BLOCKING; LOCAL SKIPPED | WAV/MP4 live request přes všechny nakonfigurované direct modely | bez secretu nebo při chybě provideru release workflow failne |

## Technická zjištění

### Odborné markery

Validovaná sada zahrnuje `EDU_CHART`, `EDU_COORD`, `EDU_MUSIC`, `EDU_CHEM`, `EDU_MAP`, `EDU_CIRCUIT`, `EDU_MATH` a `EDU_OFFICE`. Data markeru jsou součástí zadání; QA/revize je nesmí měnit bez současné změny textu a řešení.

### Matematika

`school-cas.js` používá vlastní tokenizer/parser a deterministická vzorkování; nevolá `eval`, `new Function` ani externí CAS. Lineární soustavy řeší Gaussovou eliminací. `tex-math.js` generuje MathML a eviduje nepodporované příkazy, takže surový neznámý TeX není tiše označen za správně vykreslený.

### Chemie

`chemistry-engine.js` odděluje parsing, grafovou validaci a layout. Renderer kreslí až po validačním výsledku. Explicitní elektronové údaje mají vlastní rozsahové kontroly.

### Mapy

`geojson-engine.js` validuje typ kolekce a geometrii, bounds, množství feature/point a marker size. Zjednodušení probíhá lokálně; identifikátory/názvy oblastí se zachovávají pro didaktické highlight/answer-key vazby.

### Office

Importní pipeline nyní rozlišuje „umím sémanticky rekonstruovat“ a „musím zachovat originální obraz“. Běžné DrawingML tvary se převádějí do `EDU_OFFICE`; nepodporované graphic-frame/OLE případy zvyšují `unsupportedNativeCount` a přidávají `OFFICE_VISUAL_REVIEW`.

### Multimédia

Médium zůstává samostatným zdrojem. Žákovský výstup nesmí obsahovat souvislý únik transkriptu. Live provider script negeneruje falešný úspěch: bez credentialu uloží `skipped`; required režim je nenulový exit.

## Regrese

Ověřeno na finální pracovní kopii:

- `npm test` — PASS.
- 142/142 interních testů — PASS.
- platform — 109/109 PASS.
- all-subject static — 79/79 PASS.
- specialist engines — 19/19 PASS.
- school subject browser matrix — 111/111 názvů/routingů PASS.
- Office-rich synthetic DOCX/PPTX/XLSX — PASS.
- renderer browser QA — PASS.
- multimedia unit/browser QA — PASS.
- `qa:quality` — 31/31 PASS.
- XSS regression — PASS.

### Zmrazený performance budget

Budget nebyl zvýšen. Po přesunu velkých lazy specialistických modulů z instalačního precache do runtime cache a odstranění test/school-only konfigurace ze standardního `dist`:

- `dist`: 1 049 326 B / 1 050 000 B,
- entry HTML: 488 532 B / 490 000 B,
- entry critical: 663 502 B / 670 000 B,
- largest inline script: 376 771 B / 380 000 B,
- precache: 954 882 B / 970 000 B,
- largest file: 488 532 B / 490 000 B,
- duplicate assets: 0.

### P5 prostředí

Kompletní P5 běh prošel všechny předchozí kroky a zastavil se na `qa:runtime`, protože sandboxové Chromium odmítlo lokální HTTP navigaci s `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Samostatný XSS audit prošel. Release agregace proto korektně hlásí 36/37 a acceptance 13/15 (chybí runtime report a jeho návazná acceptance kontrola). Nebyl vytvořen falešný runtime PASS.

### Provider prostředí

V auditním prostředí nebyl nastaven `DPL_LIVE_GEMINI_API_KEY` ani `GEMINI_API_KEY`. `qa:provider:live` proto skončil `status: skipped`, `reason: missing-credentials`. GitHub release/deploy workflow vyžaduje `DPL_LIVE_GEMINI_API_KEY` a spouští `qa:provider:live:required`; skutečný release je tedy možné nastavit tak, aby bez živého audio/video PASS neprošel.

## Zbytkové technické hranice — nejsou tiché mezery

1. Profesionální notový engraving, import plného MusicXML/MIDI a audio-to-score nejsou nahrazovány přibližnou notací; zdroj se zachová.
2. Chemie není obecný RDKit-class engine pro 3D/stereochemii/reakční mechanismy; běžná gymnaziální 2D struktura a Lewis jsou pokryté, mimo rozsah se vyžaduje kontrola.
3. Elektrický renderer není EDA/CAD simulátor; kreslí přesnou školní topologii a značky, ne SPICE výpočet.
4. GeoJSON pokrývá polygonové didaktické vrstvy; rastry, tiles a GIS analýza nejsou předstírány jako totéž.
5. TeX parser není univerzální TeX interpreter a CAS není obecný symbolický matematický systém; neznámé konstrukce se explicitně odmítnou.
6. Libovolný proprietární Office 3D efekt, animace, embedded OLE nebo pixelově přesný SmartArt nelze spolehlivě reimplementovat v tomto browserovém importéru; fail-safe vyžaduje originální obraz/PDF.
7. Externí providerový PASS nelze vytvořit bez skutečného credentialu; CI gate zajišťuje, že se tato skutečnost při release nezamaskuje.

## Doporučení pro release

Před označením produkčního release jako úplně providerově ověřeného nastavit v GitHubu secret `DPL_LIVE_GEMINI_API_KEY` a nechat proběhnout release/deploy workflow. Pokud live audio i video smoke projdou a P5 runtime proběhne v normálním GitHub Actions prostředí, lze 1.3.28 označit za **GO pro definovaný gymnaziální rozsah s explicitními fail-safe hranicemi**.
