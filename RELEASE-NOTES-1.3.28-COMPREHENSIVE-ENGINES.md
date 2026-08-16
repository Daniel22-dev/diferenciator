# Diferenciátor 1.3.28 — Comprehensive Engines

**Datum:** 2026-08-15  
**Výchozí verze:** 1.3.27  
**Cíl:** odstranit sedm známých hranic univerzálního gymnaziálního použití bez zvyšování zmrazených výkonových budgetů a bez tichého zkreslování odborných podkladů.

## 1. Hudební notace

`EDU_MUSIC` už není omezený na jednoduchou jednohlasou melodii. Umí více osnov a hlasů, houslový/basový/altový/tenorový klíč, noty, akordy a pomlky v běžných školních hodnotách, posuvky, pomocné linky, taktové čáry, předznamenání a metrum, dynamiku, text/lyrics, artikulace, tečky, ligatury/slury a tempo. Starý jednoduchý formát zůstává kompatibilní.

Rozsah je cílený na úlohy gymnázia. Není to náhrada profesionálního notačního editoru se sazbou orchestrální partitury, mikrotonalitou nebo kompletním MusicXML engravingem; takový vstup musí zůstat zachovaný jako zdrojový obraz/PDF.

## 2. Chemie

Nový chemický engine obsahuje kompaktní školní SMILES parser, deterministický molekulový graf, kontrolu endpointů/vazeb a valenční kontrolu běžných prvků. Explicitní graf podporuje izotopy, explicitní vodíky, formální náboj, volné elektronové páry a radikálové elektrony, takže pokrývá i Lewisovy úlohy. Nevalidní nebo zjevně přetížená struktura se nevykreslí jako „správná“.

Jde o didaktický 2D engine, nikoli kvantově-chemický/3D/stereochemický validátor všech existujících sloučenin. Prvky a vazebné stavy mimo lokální školní tabulku vyžadují explicitní kontrolu.

## 3. Elektrická schémata

Nový `EDU_CIRCUIT` kreslí vodiče a běžné školní značky: rezistor, LDR, termistor, potenciometr, kondenzátor, cívku, článek/baterii, spínač, žárovku, motor, ampérmetr, voltmetr, zdroj AC, proudový zdroj, diodu/LED, pojistku a zem. Vícevývodová vrstva přidává NPN/PNP tranzistor, operační zesilovač, transformátor a SPDT. Zapojení je tvořeno pojmenovanými uzly, takže topologie není závislá na volném kreslení AI.

## 4. Mapy a GeoJSON

`.geojson` je přímý vstup. Lokální engine přijímá `FeatureCollection` s `Polygon`/`MultiPolygon`, validuje rozsah, drží identifikátory/názvy oblastí, počítá bounds a adaptivně zjednoduší extrémně husté hranice. `EDU_MAP` tak není omezen na world/europe/czechia preset: lze vložit kraje, okresy, povodí, geologické oblasti nebo vlastní tematickou školní polygonovou vrstvu.

Import má limity počtu prvků/bodů a velikosti markeru, aby neohrozil browser/PWA. Nepodporovaná geometrie se odmítne místo tichého přibližného převodu.

## 5. TeX/MathML a školní CAS

Sazba a matematická správnost jsou oddělené. TeX parser převádí gymnaziální zápis na MathML: zlomky, odmocniny, skripty, řecké znaky, funkce, relace, sumy/součiny/integrály, limity, matice/cases, binomické koeficienty, akcenty a běžné textové/fontové konstrukce. Neznámý příkaz se explicitně vrací jako nepodporovaný.

Deterministický CAS bez `eval` a bez sítě ověřuje ekvivalenci výrazů, derivace, numerické dosazení s očekávaným výsledkem, lineární a kvadratické rovnice a lineární soustavy Gaussovou eliminací až do 8 neznámých. Nejde o univerzální TeX makroprocesor ani Mathematica-class CAS; hranice jsou detekované a fail-safe.

## 6. Office nativní objekty

`office-rich` zachovává existující obrázky/grafy a navíc převádí běžné DrawingML tvary a spojnice z DOCX/PPTX/XLSX do deterministického `EDU_OFFICE` SVG. U grafů se používá dostupná cached datová vrstva. U SmartArt/diagramů se zachovává čitelná textová vrstva.

Klíčová změna je fail-safe: komplexní proprietární graphic-frame/OLE/efekt, který nelze věrně rekonstruovat, se označí `OFFICE_VISUAL_REVIEW`. Aplikace jej nesmí tiše zahodit ani vydávat přibližnou kresbu za originál; pro pixelovou věrnost se použije PDF/snímek.

## 7. Skutečný audio/video provider smoke

`scripts/qa-provider-multimedia-live.mjs` vytváří krátký WAV a MP4 vzorek a testuje skutečný direct provider pro všechny nakonfigurované modely. Credential čte z `DPL_LIVE_GEMINI_API_KEY` nebo `GEMINI_API_KEY`. Bez klíče běžný lokální test vrací `skipped`; `DPL_LIVE_REQUIRED=1` chybějící credential nebo neúspěšný call blokuje.

GitHub release/deploy workflow nyní spouští `npm run qa:provider:live:required` mimo pull request a očekává repository secret `DPL_LIVE_GEMINI_API_KEY`. Tím se externí providerová kompatibilita stává release podmínkou, ne předpokladem.

## Release gate

- `npm test`: PASS, včetně **142/142 interních testů**.
- platform conformance: **109/109 PASS**.
- all-subject static: **79/79 PASS**.
- specialist engines: **19/19 PASS**.
- 111 reálných školních názvů/předmětů: browser gate PASS.
- renderer browser gate: PASS pro chart, coordinate, music, chemistry/Lewis, map/GeoJSON, circuit, math/MathML+CAS a Office.
- Office-rich browser gate: PASS pro syntetický DOCX, PPTX a XLSX včetně grafu/tvaru.
- multimedia unit/browser: PASS; ochrana proti úniku transkriptu zůstává aktivní.
- performance gate: **31/31 PASS** bez zvýšení budgetů.
- finální velikost `dist`: **1 049 326 / 1 050 000 B**; precache: **954 882 / 970 000 B**.
- XSS regression: PASS.
- lokální live-provider smoke: **SKIPPED — missing credentials**, což je očekávané a není vydáváno za PASS.
- kompletní P5 v tomto sandboxu: **36/37**, jediná chybějící brána je runtime report po `ERR_BLOCKED_BY_ADMINISTRATOR` při navigaci lokálního HTTP Chromia; acceptance **13/15** jako návazný důsledek. Report nebyl falšován.

## Release závěr

**1.3.28 je implementačně 7/7 pro definovaný gymnaziální rozsah a používá fail-safe hranice místo tichého zkreslení.** Externí providerový bod je navíc release-blocking v GitHub Actions, ale jeho skutečný PASS musí vzniknout až v prostředí s nastaveným `DPL_LIVE_GEMINI_API_KEY`. Arbitrární profesionální Office/TeX/chemické/hudební formáty mimo gymnaziální rozsah se nezaměňují za podporu — jsou explicitně odmítnuty nebo vyžadují zachování originálu.
