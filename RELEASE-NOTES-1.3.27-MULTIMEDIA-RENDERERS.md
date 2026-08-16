# Diferenciátor 1.3.27 — Multimédia a odborné renderery

**Datum:** 14. 8. 2026  
**Základ:** 1.3.26 Gymnasium Coverage  
**Cíl:** odstranit největší praktické mezery z auditu 1.3.26 — přímé audio/video podklady, tvorbu nových přesných odborných vizuálů a významové zachování nativních Office grafů.

## Co přináší 1.3.27

### 1. Přímé audio a video

Diferenciátor přijímá běžné audio/video soubory (např. MP3, WAV, M4A, AAC, OGG/FLAC/WebM audio; MP4/M4V, WebM, MOV, OGV video) jako pevný zdrojový podklad. Přímý zdroj má bezpečný limit 12 MB a současně musí projít celkovým limitem inline API payloadu.

Pro multimediální pracovní list platí nový invariant:

- zdrojový soubor se při paralelní variantě nemění;
- žákovská část používá marker `[[MEDIA_SOURCE]]`;
- přepis, titulky, přesné repliky ani informace, které má žák teprve zjistit poslechem/pozorováním, se nesmí automaticky dostat do `student_instructions` nebo `tasks`;
- transkript/rozbor smí sloužit učiteli, `answer_key` a `teacher_note`;
- lokální pojistka hledá dlouhou souvislou shodu zdrojového přepisu s žákovským textem a při nálezu generování/revizi zablokuje;
- na obrazovce je zdroj přehratelný; PDF zdrojové audio/video nevkládá, ale uvede název souboru a instrukci, že jej učitel přehraje / přiloží samostatně;
- projektový export/import zachovává použité médium, ale ne API klíč.

### 2. Deterministické odborné SVG renderery

Nový lazy modul `educational-renderers.js` umí z bezpečného strojově čitelného markeru vytvořit vlastní SVG bez generativního obrázku a bez externí sítě:

- `EDU_CHART` — sloupcový, čárový a koláčový datový graf;
- `EDU_COORD` — osy, body, úsečky, polygony, kružnice a lomené čáry v souřadnicích;
- `EDU_MUSIC` — jednoduchý jednohlasý příklad s houslovým/basovým klíčem, metrem, tóny, délkami a předznamenáním;
- `EDU_CHEM` — jednoduchý 2D atom-vazba diagram včetně jednoduché/dvojné/trojné vazby a náboje;
- `EDU_MAP` — statický nízkorozlišovací školní obrys world/europe/czechia, volitelně se zvýrazněním ISO3 nebo normalizovanými body.

AI marker nesmí použít jako přibližnou náhradu za již existující `[[VISUAL_n]]`. Zachovaný původní obrázek má přednost. U rendereru musí data souhlasit se zadáním i řešením; revize je musí změnit společně.

Mapové presety jsou statické výukové obrysy odvozené z public-domain Natural Earth low-res dat. Nejsou autoritativním zdrojem současných nebo sporných politických hranic.

### 3. Nativní Office grafy

`office-rich.js` nyní zpracovává nativní grafy ve všech třech moderních Office větvích:

- DOCX `word/charts/chart*.xml`,
- PPTX `ppt/charts/chart*.xml`,
- XLSX `xl/charts/chart*.xml`.

Pokud graf obsahuje použitelnou cached datovou vrstvu, parser získá kategorie/řady/hodnoty a vytvoří `[[EDU_CHART|...]]`. Zároveň ponechá technický přepis zdrojových oblastí pro AI a audit. U složitějšího nebo nepodporovaného grafu se nepředstírá pixelová rekonstrukce.

DOCX/PPTX SmartArt a nativní diagramy zachovávají alespoň čitelnou textovou vrstvu. Pixelově shodný vzhled komplexního Office objektu nadále vyžaduje PDF nebo snímek.

### 4. Validace a QA

Přibyly tři samostatné blokující brány:

- `qa:multimedia` — 19/19 jednotkových/statických kontrol;
- `qa:multimedia:browser` — skutečný Chromium tok MP3 → zdroj → marker → přehrávač → leak guard → tiskový callout;
- `qa:renderers` — skutečné Chromium vykreslení grafu, souřadnic, notace, chemie a mapy do SVG.

Office QA fyzicky sestaví syntetický DOCX, PPTX a XLSX s nativním grafem; PPTX navíc obsahuje SmartArt text a vložený obrázek, XLSX vložený obrázek. Všechny tři větve procházejí.

## Release výsledky

- `npm test`: **PASS**;
- interní testy: **142/142**;
- GHRAB platform conformance: **109/109**;
- AI profile gate: **22/22**;
- all-subject static gate: **70/70**;
- browserová klasifikace předmětů/školních názvů: **111/111**;
- multimedia QA: **19/19**;
- multimedia browser QA: **PASS**;
- deterministic renderer browser QA: **5/5 typů PASS**;
- Office-rich DOCX/PPTX/XLSX: **PASS**;
- performance gate: **31/31**;
- interní aplikace: **142/142**.

Výkonové rozpočty nebyly zvýšeny. Poslední naměřené hodnoty: dist 1 004 148 B / 1 050 000 B; entry HTML 479 541 B / 490 000 B; largest inline script 369 178 B / 380 000 B; precache 968 645 B / 970 000 B.

## P5 prostředí

P5 řetězec projde všechny funkční, buildové, předmětové, Office, multimediální, rendererové a výkonové kroky až k `qa:runtime`. V tomto sandboxu Chromium odmítne lokální runtime URL chybou `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Samostatný XSS sink audit je zelený. `qa-p5-release` proto končí 36/37 pouze na chybějícím runtime reportu a acceptance 13/15 na stejné návaznosti. Runtime report nebyl nahrazen ani ručně falšován.

## Známé hranice

1. Neproběhl živý smoke test skutečného audio/video požadavku proti produkčnímu AI provideru; browser QA ověřuje aplikaci, payload a bezpečnostní pipeline, nikoli dostupnost konkrétního modelu pro každý MIME typ.
2. `EDU_MUSIC` není plný notační engine pro polyfonii, akordové sazby, ligatury, artikulaci nebo komplexní partitury.
3. `EDU_CHEM` je deterministický kreslič zadaných atomů a vazeb, nikoli chemický validátor; správnost struktury musí potvrdit modelový audit a učitel.
4. `EDU_MAP` obsahuje pouze world/europe/czechia nízkorozlišovací obrysy; nevytváří regionální/administrativní mapy ČR a není zdrojem aktuálních sporných hranic.
5. Komplexní nativní Office grafy/SmartArt se významově zachovají jen do míry dostupné datové/textové vrstvy; pixelově věrná rekonstrukce není garantována.
6. Raw LaTeX stále není zpracováván plným TeX enginem.
7. Video se v tištěném/PDF pracovním listu samozřejmě nepřehrává; PDF obsahuje pouze vazbu na původní zdrojový soubor.

**Release verdikt:** **GO WITH KNOWN ISSUES**. Pro běžné gymnaziální testy a pracovní listy se v 1.3.27 výrazně zmenšila oblast, kde je nutný ruční workaround; zbylé hranice jsou nyní výslovně ohraničené, nikoli tiše maskované.
